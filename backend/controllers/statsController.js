const supabase = require('../config/supabase');

exports.getStats = async (req, res) => {
    try {
        // Total scans
        const { count: totalScans } = await supabase
            .from('scans')
            .select('*', { count: 'exact', head: true });

        // Active employees (scanned in last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const { count: activeEmployees } = await supabase
            .from('scans')
            .select('user_id', { count: 'exact', head: true })
            .gte('scanned_at', thirtyDaysAgo.toISOString());

        // Completed trainings
        const { count: completedTrainings } = await supabase
            .from('training_progress')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'completed');

        // Total training assignments
        const { count: totalTrainings } = await supabase
            .from('training_progress')
            .select('*', { count: 'exact', head: true });

        const complianceRate = totalTrainings > 0
            ? Math.round((completedTrainings / totalTrainings) * 100)
            : 0;

        res.json({
            totalScans: totalScans || 0,
            activeEmployees: activeEmployees || 0,
            completedTrainings: completedTrainings || 0,
            complianceRate,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
