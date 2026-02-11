const supabase = require('../config/supabase');

exports.getAllEmployees = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('*');

        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getEmployeeStats = async (req, res) => {
    try {
        // Simple aggregate fetch - in real app might need more complex join
        const { data, error } = await supabase
            .from('training_progress')
            .select('user_id, status');

        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateProgress = async (req, res) => {
    const { userId, contentId, status } = req.body;
    try {
        const { data, error } = await supabase
            .from('training_progress')
            .upsert([
                { 
                    user_id: userId, 
                    content_id: contentId, 
                    status, 
                    completed_at: status === 'completed' ? new Date().toISOString() : null 
                }
            ], { onConflict: 'user_id, content_id' })
            .select();

        if (error) throw error;
        res.json(data[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getEmployeeProgress = async (req, res) => {
    const { userId } = req.params;
    try {
        const { data, error } = await supabase
            .from('training_progress')
            .select('*')
            .eq('user_id', userId);

        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
