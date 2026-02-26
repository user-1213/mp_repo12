import { Router } from 'express';
import { Db } from 'mongodb';

export default function analyticsRoutes(db: Db) {
  const router = Router();

  // Get dashboard statistics
  router.get('/dashboard', async (req, res) => {
    try {
      const tickets = db.collection('tickets');

      const [
        totalTickets,
        resolvedTickets,
        pendingTickets,
        highPriorityTickets,
        avgResolutionTime,
        ticketsByCategory,
        ticketsByPriority,
        ticketsByStatus,
      ] = await Promise.all([
        tickets.countDocuments(),
        tickets.countDocuments({ status: 'Resolved' }),
        tickets.countDocuments({ status: 'Pending' }),
        tickets.countDocuments({ priority: 'critical' }),
        tickets
          .aggregate([
            {
              $match: { status: 'Resolved', resolutionTime: { $exists: true } },
            },
            {
              $group: {
                _id: null,
                avgTime: {
                  $avg: {
                    $subtract: ['$resolutionTime', '$createdAt'],
                  },
                },
              },
            },
          ])
          .toArray(),
        tickets
          .aggregate([
            {
              $group: {
                _id: '$category',
                count: { $sum: 1 },
              },
            },
          ])
          .toArray(),
        tickets
          .aggregate([
            {
              $group: {
                _id: '$priority',
                count: { $sum: 1 },
              },
            },
          ])
          .toArray(),
        tickets
          .aggregate([
            {
              $group: {
                _id: '$status',
                count: { $sum: 1 },
              },
            },
          ])
          .toArray(),
      ]);

      res.json({
        totalTickets,
        resolvedTickets,
        pendingTickets,
        highPriorityTickets,
        resolutionRate: totalTickets > 0 ? (resolvedTickets / totalTickets) * 100 : 0,
        avgResolutionTimeMinutes:
          avgResolutionTime.length > 0
            ? Math.round(avgResolutionTime[0].avgTime / (1000 * 60))
            : 0,
        ticketsByCategory: ticketsByCategory.reduce(
          (acc: any, item: any) => {
            acc[item._id] = item.count;
            return acc;
          },
          {}
        ),
        ticketsByPriority: ticketsByPriority.reduce(
          (acc: any, item: any) => {
            acc[item._id] = item.count;
            return acc;
          },
          {}
        ),
        ticketsByStatus: ticketsByStatus.reduce(
          (acc: any, item: any) => {
            acc[item._id] = item.count;
            return acc;
          },
          {}
        ),
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
      res.status(500).json({ error: 'Failed to fetch analytics' });
    }
  });

  // Get agent performance
  router.get('/agents', async (req, res) => {
    try {
      const tickets = db.collection('tickets');

      const agentStats = await tickets
        .aggregate([
          {
            $match: { assignedAgent: { $exists: true, $ne: null } },
          },
          {
            $group: {
              _id: '$assignedAgent',
              totalAssigned: { $sum: 1 },
              resolved: {
                $sum: { $cond: [{ $eq: ['$status', 'Resolved'] }, 1, 0] },
              },
              avgResolutionTime: {
                $avg: {
                  $cond: [
                    { $eq: ['$status', 'Resolved'] },
                    { $subtract: ['$resolutionTime', '$createdAt'] },
                    null,
                  ],
                },
              },
            },
          },
        ])
        .toArray();

      const agents = agentStats.map((stat: any) => ({
        agentId: stat._id,
        totalAssigned: stat.totalAssigned,
        resolved: stat.resolved,
        resolutionRate:
          stat.totalAssigned > 0 ? (stat.resolved / stat.totalAssigned) * 100 : 0,
        avgResolutionTimeMinutes: stat.avgResolutionTime
          ? Math.round(stat.avgResolutionTime / (1000 * 60))
          : 0,
      }));

      res.json({ agents });
    } catch (error) {
      console.error('Error fetching agent stats:', error);
      res.status(500).json({ error: 'Failed to fetch agent stats' });
    }
  });

  // Get trends over time
  router.get('/trends', async (req, res) => {
    try {
      const { days = 30 } = req.query;
      const tickets = db.collection('tickets');

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - Number(days));

      const trends = await tickets
        .aggregate([
          {
            $match: { createdAt: { $gte: startDate } },
          },
          {
            $group: {
              _id: {
                $dateToString: {
                  format: '%Y-%m-%d',
                  date: '$createdAt',
                },
              },
              created: { $sum: 1 },
              resolved: {
                $sum: { $cond: [{ $eq: ['$status', 'Resolved'] }, 1, 0] },
              },
            },
          },
          { $sort: { _id: 1 } },
        ])
        .toArray();

      res.json({ trends });
    } catch (error) {
      console.error('Error fetching trends:', error);
      res.status(500).json({ error: 'Failed to fetch trends' });
    }
  });

  return router;
}
