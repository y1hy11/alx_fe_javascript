async function sendQuoteToServer(quote) {
    try {
        const response = await fetch('https://jsonplaceholder.typicode.com/posts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(quote)
        });
        
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        
        const data = await response.json();
        showNotification('Quote successfully sent to server', 'success');
        return data;
    } catch (error) {
        console.error('Error sending quote to server:', error);
        showNotification('Failed to send quote to server', 'error');
        return null;
    }
}
