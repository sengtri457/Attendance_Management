const axios = require('axios');
const moment = require('moment-timezone');

const sendAttendanceNotification = async (attendance, student, subject = null) => {
    try {
        const token = process.env.TELEGRAM_BOT_TOKEN;
        const chatId = process.env.TELEGRAM_CHAT_ID;

        if (! token || ! chatId) {
            console.warn('Telegram credentials not set in environment variables.');
            return;
        }

        const statusEmoji = {
            'present': '✅',
            'absent': '❌',
            'late': '⚠️',
            'excused': '🟢',
            'on-leave': '🏝️',
            'half-day': '🌓'
        };

        const emoji = statusEmoji[attendance.status] || '📝';
        const time = attendance.checkInTime ? moment(attendance.checkInTime).tz("Asia/Phnom_Penh").format('hh:mm A') : 'N/A';
        const date = moment(attendance.date).format('YYYY-MM-DD');

        let message = `<b>${emoji} Attendance Update</b>\n\n`;
        message += `👤 <b>Student:</b> ${
            student.firstName
        } ${
            student.lastName
        } (${
            student.studentId
        })\n`;
        message += `📅 <b>Date:</b> ${date}\n`;
        message += `⏰ <b>Time:</b> ${time}\n`;
        message += `Fc <b>Status:</b> ${
            attendance.status.toUpperCase()
        }\n`;

        if (subject) {
            message += `📚 <b>Subject:</b> ${
                subject.subjectName
            }\n`;
        }

        if (attendance.isLate) {
            message += `⚠️ <b>Late By:</b> ${
                attendance.lateBy
            } mins\n`;
        }

        if (attendance.note) {
            message += `📝 <b>Note:</b> ${
                attendance.note
            }\n`;
        }

        // Send Text Message
        await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
            chat_id: chatId,
            text: message,
            parse_mode: 'HTML'
        });

        // Optional: Send Photo if available and valid URL
        // if (student.photo && student.photo.startsWith('http')) {
        //     await axios.post(`https://api.telegram.org/bot${token}/sendPhoto`, {
        //         chat_id: chatId,
        //         photo: student.photo,
        //         caption: `Photo of ${student.firstName}`
        //     }).catch(err => console.error('Error sending photo:', err.message));
        // }

    } catch (error) {
        console.error('Error sending Telegram notification:', error.message);
    }
};

module.exports = {
    sendAttendanceNotification
};
