let quotes = [
    { text: "The greatest glory in living lies not in never falling, but in rising every time we fall.", category: "motivation", author: "Nelson Mandela", id: 1 },
    { text: "The way to get started is to quit talking and begin doing.", category: "motivation", author: "Walt Disney", id: 2 },
    { text: "Life is what happens when you're busy making other plans.", category: "life", author: "John Lennon", id: 3 },
    { text: "You only live once, but if you do it right, once is enough.", category: "life", author: "Mae West", id: 4 },
    { text: "In the end, we will remember not the words of our enemies, but the silence of our friends.", category: "friendship", author: "Martin Luther King Jr.", id: 5 }
];

let lastSyncTime = localStorage.getItem('lastSyncTime') || 0;

const quoteDisplay = document.getElementById("quoteDisplay");
const newQuoteButton = document.getElementById("newQuote");
const categoryFilter = document.getElementById("categoryFilter");

function generateId() {
    return Date.now() + Math.random();
}

function loadQuotes() {
    const savedQuotes = localStorage.getItem('quotes');
    if (savedQuotes) {
        quotes = JSON.parse(savedQuotes);
    }
    quotes.forEach(quote => {
        if (!quote.id) {
            quote.id = generateId();
        }
    });
}

function saveQuotes() {
    localStorage.setItem('quotes', JSON.stringify(quotes));
    localStorage.setItem('lastSyncTime', Date.now().toString());
}

function showRandomQuote() {
    const filteredQuotes = getFilteredQuotes();
    if (filteredQuotes.length === 0) {
        quoteDisplay.innerHTML = "No quotes available for this category.";
        return;
    }
    
    const randomIndex = Math.floor(Math.random() * filteredQuotes.length);
    const quote = filteredQuotes[randomIndex];
    quoteDisplay.innerHTML = `
        <blockquote>
            "${quote.text}"
            <footer>- ${quote.author} (${quote.category})</footer>
        </blockquote>
    `;
    
    sessionStorage.setItem('lastViewedQuote', JSON.stringify(quote));
}

function getFilteredQuotes() {
    const selectedCategory = categoryFilter.value;
    if (selectedCategory === 'all') {
        return quotes;
    }
    return quotes.filter(quote => quote.category === selectedCategory);
}

function filterQuotes() {
    const selectedCategory = categoryFilter.value;
    localStorage.setItem('selectedCategory', selectedCategory);
    showRandomQuote();
}

function populateCategories() {
    const categories = [...new Set(quotes.map(quote => quote.category))];
    
    categoryFilter.innerHTML = '<option value="all">All Categories</option>';
    
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category.charAt(0).toUpperCase() + category.slice(1);
        categoryFilter.appendChild(option);
    });
    
    const savedCategory = localStorage.getItem('selectedCategory');
    if (savedCategory) {
        categoryFilter.value = savedCategory;
    }
}

function addQuote() {
    const newQuoteText = document.getElementById('newQuoteText').value;
    const newQuoteCategory = document.getElementById('newQuoteCategory').value;
    
    if (newQuoteText && newQuoteCategory) {
        const newQuote = {
            text: newQuoteText,
            category: newQuoteCategory.toLowerCase(),
            author: "User",
            id: generateId(),
            timestamp: Date.now()
        };
        
        quotes.push(newQuote);
        saveQuotes();
        populateCategories();
        
        document.getElementById('newQuoteText').value = '';
        document.getElementById('newQuoteCategory').value = '';
        
        showNotification('Quote added successfully!', 'success');
    } else {
        showNotification('Please enter both quote text and category.', 'error');
    }
}

function createAddQuoteForm() {
    const addQuoteDiv = document.getElementById('addQuoteForm');
    if (addQuoteDiv) {
        addQuoteDiv.style.display = 'block';
    }
}

function exportToJsonFile() {
    const dataStr = JSON.stringify(quotes, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = 'quotes.json';
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(url);
}

function importFromJsonFile(event) {
    const fileReader = new FileReader();
    fileReader.onload = function(event) {
        try {
            const importedQuotes = JSON.parse(event.target.result);
            
            if (Array.isArray(importedQuotes)) {
                const conflictResolution = resolveConflicts(importedQuotes);
                if (conflictResolution.conflicts.length > 0) {
                    showConflictResolution(conflictResolution);
                } else {
                    mergeQuotes(importedQuotes);
                    showNotification('Quotes imported successfully!', 'success');
                }
            } else {
                showNotification('Invalid file format. Please upload a valid JSON file.', 'error');
            }
        } catch (error) {
            showNotification('Error reading file. Please ensure it\'s a valid JSON file.', 'error');
        }
    };
    fileReader.readAsText(event.target.files[0]);
}

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

function resolveConflicts(serverQuotes) {
    const conflicts = [];
    const existingIds = quotes.map(q => q.id);
    const newQuotes = [];
    
    serverQuotes.forEach(serverQuote => {
        const existingQuote = quotes.find(q => q.id === serverQuote.id);
        
        if (existingQuote) {
            if (serverQuote.timestamp > existingQuote.timestamp) {
                conflicts.push({
                    local: existingQuote,
                    server: serverQuote,
                    resolution: 'server'
                });
            }
        } else {
            newQuotes.push(serverQuote);
        }
    });
    
    return { conflicts, newQuotes };
}

function mergeQuotes(newQuotes) {
    quotes.push(...newQuotes);
    saveQuotes();
    populateCategories();
    showRandomQuote();
}

function applyConflictResolution(conflicts, resolution) {
    conflicts.forEach(conflict => {
        const index = quotes.findIndex(q => q.id === conflict.local.id);
        if (index !== -1 && resolution === 'server') {
            quotes[index] = conflict.server;
        }
    });
    
    saveQuotes();
    populateCategories();
    showRandomQuote();
    showNotification(`Conflicts resolved using ${resolution} data`, 'success');
}

function showConflictResolution(conflictData) {
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.5); z-index: 2000; display: flex;
        align-items: center; justify-content: center;
    `;
    
    modal.innerHTML = `
        <div style="background: white; padding: 20px; border-radius: 8px; max-width: 500px; width: 90%;">
            <h3>Data Conflicts Detected</h3>
            <p>${conflictData.conflicts.length} conflicts found. Server data is newer.</p>
            <div style="margin: 15px 0;">
                <button id="useServer" style="margin-right: 10px; padding: 8px 16px; background: #4CAF50; color: white; border: none; border-radius: 4px;">
                    Use Server Data
                </button>
                <button id="keepLocal" style="margin-right: 10px; padding: 8px 16px; background: #f44336; color: white; border: none; border-radius: 4px;">
                    Keep Local Data
                </button>
                <button id="cancelImport" style="padding: 8px 16px; background: #666; color: white; border: none; border-radius: 4px;">
                    Cancel
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    document.getElementById('useServer').onclick = () => {
        applyConflictResolution(conflictData.conflicts, 'server');
        mergeQuotes(conflictData.newQuotes);
        document.body.removeChild(modal);
    };
    
    document.getElementById('keepLocal').onclick = () => {
        mergeQuotes(conflictData.newQuotes);
        document.body.removeChild(modal);
        showNotification('Local data preserved, new quotes added', 'success');
    };
    
    document.getElementById('cancelImport').onclick = () => {
        document.body.removeChild(modal);
    };
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.textContent = message;
    
    const colors = {
        success: '#4CAF50',
        error: '#f44336',
        info: '#2196F3',
        warning: '#ff9800'
    };
    
    notification.style.cssText = `
        position: fixed; top: 20px; right: 20px; background: ${colors[type]};
        color: white; padding: 12px 20px; border-radius: 5px; z-index: 1000;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2); max-width: 300px;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (document.body.contains(notification)) {
            document.body.removeChild(notification);
        }
    }, 4000);
}

async function syncQuotes() {
    showNotification('Syncing with server...', 'info');
    
    const serverQuotes = await fetchQuotesFromServer();
    
    if (serverQuotes.length > 0) {
        const conflictResolution = resolveConflicts(serverQuotes);
        
        if (conflictResolution.conflicts.length > 0) {
            alert('Conflicts found during sync!');
            showConflictResolution(conflictResolution);
        } else if (conflictResolution.newQuotes.length > 0) {
            mergeQuotes(conflictResolution.newQuotes);
            alert('New quotes synced successfully!');
            showNotification('Quotes synced with server!', 'success');
        } else {
            alert('No new quotes found');
            showNotification('No new quotes to sync', 'info');
        }
    } else {
        alert('Server has no quotes');
        showNotification('No quotes available from server', 'info');
    }
}

function manualSync() {
    syncQuotes();
}

newQuoteButton.addEventListener("click", showRandomQuote);

function initializeApp() {
    loadQuotes();
    populateCategories();
    showRandomQuote();
    createAddQuoteForm();
    
    const lastViewed = sessionStorage.getItem('lastViewedQuote');
    if (lastViewed) {
        console.log('Last viewed quote:', JSON.parse(lastViewed));
    }
    
    const syncButton = document.createElement('button');
    syncButton.textContent = 'Manual Sync';
    syncButton.onclick = manualSync;
    syncButton.style.cssText = 'margin: 10px; padding: 8px 16px; background: #2196F3; color: white; border: none; border-radius: 4px;';
    document.body.appendChild(syncButton);
    
    setInterval(syncQuotes, 30000);
    
    showNotification('App initialized. Auto-sync enabled.', 'success');
}

document.addEventListener('DOMContentLoaded', initializeApp);
