const supabase = require('../config/supabase');

exports.getAllQRs = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('qr_codes')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.createQR = async (req, res) => {
    const { machineName, location } = req.body;
    try {
        const { data, error } = await supabase
            .from('qr_codes')
            .insert([{ machine_name: machineName, location }])
            .select();

        if (error) throw error;

        res.status(201).json(data[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getQRWithContent = async (req, res) => {
    const { id } = req.params;
    try {
        // Fetch QR details along with mapped content
        const { data, error } = await supabase
            .from('qr_codes')
            .select(`
                *,
                qr_content_mapping (
                    training_content (*)
                )
            `)
            .eq('id', id)
            .single();

        if (error) throw error;
        if (!data) return res.status(404).json({ error: 'QR Code not found' });

        // Flatten structure for easier consumption
        const formattedData = {
            ...data,
            training_content: data.qr_content_mapping.map(m => m.training_content).filter(Boolean)
        };
        delete formattedData.qr_content_mapping;

        res.json(formattedData);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
