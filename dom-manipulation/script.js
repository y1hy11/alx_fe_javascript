let quotes = [
  { text: "The greatest glory in living lies not in never falling, but in rising every time we fall.", category: "motivation", author: "Nelson Mandela" },
  { text: "The way to get started is to quit talking and begin doing.", category: "motivation", author: "Walt Disney" },
  { text: "Life is what happens when you're busy making other plans.", category: "life", author: "John Lennon" },
  { text: "You only live once, but if you do it right, once is enough.", category: "life", author: "Mae West" },
  { text: "In the end, we will remember not the words of our enemies, but the silence of our friends.", category: "friendship", author: "Martin Luther King Jr." }
];

const quoteDisplay = document.getElementById("quoteDisplay");
const newQuoteButton = document.getElementById("newQuote");
const categoryFilter = document.getElementById("categoryFilter");

function loadQuotes() {
  const savedQuotes = localStorage.getItem('quotes');
  if (savedQuotes) {
    quotes = JSON.parse(savedQuotes);
  }
}

function saveQuotes() {
  localStorage.setItem('quotes', JSON.stringify(quotes));
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
      author: "User"
    };
    
    quotes.push(newQuote);
    saveQuotes();
    populateCategories();
    
    document.getElementById('newQuoteText').value = '';
    document.getElementById('newQuoteCategory').value = '';
    
    alert('Quote added successfully!');
  } else {
    alert('Please enter both quote text and category.');
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
        quotes.push(...importedQuotes);
        saveQuotes();
        populateCategories();
        showRandomQuote();
        alert('Quotes imported successfully!');
      } else {
        alert('Invalid file format. Please upload a valid JSON file.');
      }
    } catch (error) {
      alert('Error reading file. Please ensure it\'s a valid JSON file.');
    }
  };
  fileReader.readAsText(event.target.files[0]);
}

async function fetchQuotesFromServer() {
  try {
    const response = await fetch('https://jsonplaceholder.typicode.com/posts');
    const posts = await response.json();
    
    const serverQuotes = posts.slice(0, 3).map(post => ({
      text: post.title,
      category: 'server',
      author: 'Server User ' + post.userId
    }));
    
    return serverQuotes;
  } catch (error) {
    console.error('Error fetching quotes from server:', error);
    return [];
  }
}

async function syncQuotes() {
  const serverQuotes = await fetchQuotesFromServer();
  
  if (serverQuotes.length > 0) {
    const existingTexts = quotes.map(q => q.text);
    const newQuotes = serverQuotes.filter(sq => !existingTexts.includes(sq.text));
    
    if (newQuotes.length > 0) {
      quotes.push(...newQuotes);
      saveQuotes();
      populateCategories();
      
      const notification = document.createElement('div');
      notification.textContent = `Synced ${newQuotes.length} new quotes from server!`;
      notification.style.cssText = 'position:fixed;top:10px;right:10px;background:#4CAF50;color:white;padding:10px;border-radius:5px;z-index:1000;';
      document.body.appendChild(notification);
      
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 3000);
    }
  }
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
  
  setInterval(syncQuotes, 30000);
}

document.addEventListener('DOMContentLoaded', initializeApp);
