import requests

BOT_TOKEN = '7859097671:AAFFSVN6qM2Mb_fjcq23CvLso4HFSnFaRCE'
CHAT_ID = '7925252079'

def send_telegram_alert(record):
    msg = f"📦 {record['firm']} → {record['station']} | Клей: {record['kley']} | GTD: {record.get('gtd', 0)}т"
    requests.post(f'https://api.telegram.org/bot{BOT_TOKEN}/sendMessage', data={
        'chat_id': CHAT_ID,
        'text': msg
    })
