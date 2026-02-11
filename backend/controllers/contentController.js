const supabase = require('../config/supabase');

exports.getAllContent = async (req, res) => {
    try {
        // Fetch content and potential QR links
        const { data, error } = await supabase
            .from('training_content')
            .select('*, qr_content_mapping(qr_id)');

        if (error) throw error;

        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.uploadContent = async (req, res) => {
    const { title, type, url, qrIds, duration } = req.body;
    try {
        // 1. Insert Content
        const { data: contentData, error: contentError } = await supabase
            .from('training_content')
            .insert([{ title, type, url, duration: duration || 0 }])
            .select()
            .single();

        if (contentError) throw contentError;

        const contentId = contentData.id;

        // 2. Link to QRs if provided
        if (qrIds && qrIds.length > 0) {
            const mappings = qrIds.map(qrId => ({
                qr_id: qrId,
                content_id: contentId
            }));

            const { error: mappingError } = await supabase
                .from('qr_content_mapping')
                .insert(mappings);

            if (mappingError) throw mappingError;
        }

        res.status(201).json(contentData);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.deleteContent = async (req, res) => {
    const { id } = req.params;
    try {
        const { error } = await supabase
            .from('training_content')
            .delete()
            .eq('id', id);

        if (error) throw error;

        res.status(204).send();
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateContentLinks = async (req, res) => {
    const { id } = req.params;
    const { qrIds } = req.body; // Array of QR IDs to be linked
    
    try {
        // 1. Remove existing links
        const { error: deleteError } = await supabase
            .from('qr_content_mapping')
            .delete()
            .eq('content_id', id);

        if (deleteError) throw deleteError;

        // 2. Add new links if any
        if (qrIds && qrIds.length > 0) {
            const mappings = qrIds.map(qrId => ({
                qr_id: qrId,
                content_id: id
            }));

            const { error: insertError } = await supabase
                .from('qr_content_mapping')
                .insert(mappings);

            if (insertError) throw insertError;
        }

        res.json({ message: 'Links updated successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
