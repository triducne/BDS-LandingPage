const express = require('express');
const path = require('path');
const fetch = require('node-fetch');

const app = express();
const port = process.env.PORT || 3000;

// Replace this with your own secure server-side endpoint or Google Apps Script if needed.
const BACKEND_LEAD_ENDPOINT = process.env.LEAD_ENDPOINT || 'https://script.google.com/macros/s/AKfycbybHD85YZ8EvpRLEGyGAkCYfBALElrH338ca5JwNN84HsFjNCQ4MAr5-NscEDFUkGxdjg/exec';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '/')));

app.post('/api/leads', async (req, res) => {
  try {
    const { name, phone, project } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ error: 'Thiếu tên hoặc số điện thoại.' });
    }

    const cleanedPhone = String(phone || '').trim();
    if (!/^[0-9+\s()-]{8,15}$/.test(cleanedPhone)) {
      return res.status(400).json({ error: 'Số điện thoại không hợp lệ.' });
    }

    const payload = {
      name: String(name).trim(),
      phone: cleanedPhone,
      project: String(project || '').trim(),
      createdAt: new Date().toISOString()
    };

    const response = await fetch(BACKEND_LEAD_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      return res.status(502).json({ error: 'Lỗi khi gửi dữ liệu tới backend bên thứ ba.' });
    }

    return res.status(200).json({ message: 'Đăng ký thành công.' });
  } catch (error) {
    console.error('Lead submit error:', error);
    return res.status(500).json({ error: 'Lỗi máy chủ, vui lòng thử lại sau.' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
