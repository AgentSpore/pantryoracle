/* PantryOracle Frontend Logic */
(function () {
    const baseUrl = ''; // same origin

    // DOM elements
    const searchInput = document.getElementById('search-input');
    const clearButton = document.getElementById('clear-button');
    const exampleChipsContainer = document.getElementById('example-chips');
    const searchResultsList = document.getElementById('search-results');
    const verdictCard = document.getElementById('verdict-card');
    const loadingSkeleton = document.getElementById('loading-skeleton');
    const verdictContent = document.getElementById('verdict-content');
    const foodNameEl = document.getElementById('food-name');
    const verdictPill = document.getElementById('verdict-pill');
    const verdictIcon = document.getElementById('verdict-icon');
    const verdictText = document.getElementById('verdict-text');
    const shelfSealedEl = document.getElementById('shelf-sealed');
    const shelfOpenedEl = document.getElementById('shelf-opened');
    const shelfFridgeEl = document.getElementById('shelf-fridge');
    const shelfFreezerEl = document.getElementById('shelf-freezer');
    const ranciditySignsEl = document.getElementById('rancidity-signs');
    const coldSafeEl = document.getElementById('cold-safe');
    const coldNoteEl = document.getElementById('cold-note');
    const tossRuleEl = document.getElementById('toss-rule');
    const sourcesListEl = document.getElementById('sources-list');
    const symptomExpander = document.getElementById('symptom-expander');
    const symptomInput = document.getElementById('symptom-input');
    const symptomButton = document.getElementById('symptom-button');
    const symptomResult = document.getElementById('symptom-result');
    const symptomVerdict = document.getElementById('symptom-verdict');
    const symptomExplanation = document.getElementById('symptom-explanation');
    const symptomMatchedSigns = document.getElementById('symptom-matched-signs');

    // State
    let debounceTimeout = null;
    let currentFoodId = null;
    let highlightedIndex = -1;
    const exampleChips = [
        "walnuts", "olive oil", "cooked rice", "almonds", "honey", "bread", "milk", "eggs",
        "cheese", "yogurt", "chicken", "beef", "fish", "potatoes", "tomatoes", "apples"
    ];

    // Initialize
    function init() {
        // Set up event listeners
        searchInput.addEventListener('input', handleSearchInput);
        clearButton.addEventListener('click', clearSearch);
        symptomButton.addEventListener('click', checkSymptom);
        symptomInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                checkSymptom();
            }
        });
        // Close symptom expander when clicking outside? Not required.
        // Initial state: hide verdict card and search results
        hideVerdictCard();
        hideSearchResults();
        hideExampleChips();
        renderExampleChips();
    }

    // Search handling
    function handleSearchInput(e) {
        const query = e.target.value.trim();
        if (query) {
            clearButton.style.display = 'block';
            clearTimeout(debounceTimeout);
            debounceTimeout = setTimeout(() => {
                searchFoods(query);
            }, 200);
            hideExampleChips();
        } else {
            clearButton.style.display = 'none';
            hideSearchResults();
            showExampleChips();
            hideVerdictCard();
            currentFoodId = null;
        }
    }

    function clearSearch() {
        searchInput.value = '';
        clearButton.style.display = 'none';
        hideSearchResults();
        hideExampleChips();
        hideVerdictCard();
        currentFoodId = null;
        highlightedIndex = -1;
        symptomResult.classList.add('hidden');
        symptomInput.value = '';
    }

    async function searchFoods(query) {
        try {
            const response = await fetch(`${baseUrl}/api/v1/foods?q=${encodeURIComponent(query)}`);
            if (!response.ok) throw new Error('Search failed');
            const data = await response.json(); // Expect array of {id, name, category}
            renderSearchResults(data);
        } catch (err) {
            console.error(err);
            hideSearchResults();
        }
    }

    function renderExampleChips() {
        exampleChipsContainer.innerHTML = '';
        exampleChips.forEach(chip => {
            const div = document.createElement('div');
            div.className = 'px-3 py-1 rounded-full text-xs font-medium bg-surface/50 text-muted hover:bg-surface/200 cursor-pointer';
            div.textContent = chip;
            div.addEventListener('click', () => {
                searchInput.value = chip;
                handleSearchInput({ target: { value: chip } });
            });
            exampleChipsContainer.appendChild(div);
        });
    }

    function renderSearchResults(foods) {
        searchResultsList.innerHTML = '';
        highlightedIndex = -1;
        if (foods.length === 0) {
            const li = document.createElement('li');
            li.className = 'p-4 text-muted text-center';
            li.textContent = 'We don’t have that one yet';
            searchResultsList.appendChild(li);
            searchResultsList.classList.remove('hidden');
            return;
        }
        foods.forEach((food, index) => {
            const li = document.createElement('li');
            li.className = 'flex items-center justify-between p-4 cursor-pointer hover:bg-surface/50 transition-colors';
            li.dataset.id = food.id;
            li.dataset.index = index;
            li.innerHTML = `
                <div class="flex-1 min-w-0">
                    <div class="text-ink font-medium">${food.name}</div>
                    <div class="text-sm text-muted">${food.category || ''}</div>
                </div>
                <svg class="h-4 w-4 text-muted" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
            `;
            li.addEventListener('click', () => {
                selectSearchResult(food.id, food.name);
            });
            searchResultsList.appendChild(li);
        });
        searchResultsList.classList.remove('hidden');
    }

    function hideSearchResults() {
        searchResultsList.classList.add('hidden');
        searchResultsList.innerHTML = '';
    }

    function showExampleChips() {
        exampleChipsContainer.classList.remove('hidden');
    }

    function hideExampleChips() {
        exampleChipsContainer.classList.add('hidden');
    }

    function selectSearchResult(id, name) {
        searchInput.value = name;
        hideSearchResults();
        hideExampleChips();
        currentFoodId = id;
        showLoadingSkeleton();
        fetchFoodById(id);
    }

    // Keyboard navigation for search results
    function handleKeyDown(e) {
        if (!searchResultsList.classList.contains('hidden') && searchResultsList.children.length > 0) {
            const items = searchResultsList.children;
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                highlightedIndex = (highlightedIndex + 1) % items.length;
                updateHighlight();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                highlightedIndex = (highlightedIndex - 1 + items.length) % items.length;
                updateHighlight();
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (highlightedIndex >= 0 && highlightedIndex < items.length) {
                    const item = items[highlightedIndex];
                    const id = item.dataset.id;
                    const name = item.querySelector('.text-ink').textContent;
                    selectSearchResult(id, name);
                }
            }
        }
    }

    function updateHighlight() {
        const items = searchResultsList.children;
        items.forEach((item, index) => {
            if (index === highlightedIndex) {
                item.classList.add('bg-surface/200');
            } else {
                item.classList.remove('bg-surface/200');
            }
        });
    }

    // Verdict card loading
    function showLoadingSkeleton() {
        loadingSkeleton.classList.remove('hidden');
        verdictContent.classList.add('hidden');
        verdictCard.classList.remove('hidden');
    }

    function hideLoadingSkeleton() {
        loadingSkeleton.classList.add('hidden');
        verdictContent.classList.remove('hidden');
    }

    function hideVerdictCard() {
        verdictCard.classList.add('hidden');
    }

    async function fetchFoodById(id) {
        try {
            const response = await fetch(`${baseUrl}/api/v1/foods/${id}`);
            if (!response.ok) throw new Error('Food not found');
            const data = await response.json();
            populateVerdict(data);
            hideLoadingSkeleton();
        } catch (err) {
            console.error(err);
            hideLoadingSkeleton();
            hideVerdictCard();
            currentFoodId = null;
        }
    }

    function populateVertict(data) {
        foodNameEl.textContent = data.name || '';
        renderVerdictPill(data.toss_rule || '');
        shelfSealedEl.textContent = data.shelf_sealed ? `${data.shelf_sealed} days` : '—';
        shelfOpenedEl.textContent = data.shelf_opened ? `${data.shelf_opened} days` : '—';
        shelfFridgeEl.textContent = data.shelf_fridge ? `${data.shelf_fridge} days` : '—';
        shelfFreezerEl.textContent = data.shelf_freezer ? `${data.shelf_freezer} days` : '—';
        // Rancidity signs
        ranciditySignsEl.innerHTML = '';
        (data.rancidity_signs || []).forEach(sign => {
            const li = document.createElement('li');
            li.textContent = sign;
            ranciditySignsEl.appendChild(li);
        });
        // Cold safe
        const coldSafe = data.cold_safe;
        if (coldSafe === true) {
            coldSafeEl.textContent = 'Yes';
            coldNoteEl.textContent = data.cold_note || '';
        } else if (coldSafe === false) {
            coldSafeEl.textContent = 'No';
            coldNoteEl.textContent = data.cold_note || '';
        } else {
            coldSafeEl.textContent = 'Depends';
            coldNoteEl.textContent = data.cold_note || '';
        }
        // Toss rule
        tossRuleEl.textContent = data.toss_rule || '';
        // Sources
        sourcesListEl.innerHTML = '';
        (data.sources || []).forEach(source => {
            const li = document.createElement('li');
            const link = document.createElement('a');
            link.href = source;
            link.target = '_blank';
            link.rel = 'noopener';
            link.textContent = source;
            link.className = 'text-muted underline';
            li.appendChild(link);
            sourcesListEl.appendChild(li);
        });
        // Show verdict card
        verdictCard.classList.remove('hidden');
    }

    function renderVerdictPill(tossRule) {
        const lower = tossRule.toLowerCase();
        if (lower.includes('keep') || lower.includes('safe')) {
            verdictPill.className = 'px-4 py-2 rounded-full font-semibold text-white text-lg flex items-center space-x-2 bg-keep-green';
            verdictText.textContent = 'Keep';
            verdictIcon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>';
        } else if (lower.includes('toss') || lower.includes('discard') || lower.includes('throw')) {
            verdictPill.className = 'px-4 py-2 rounded-full font-semibold text-white text-lg flex items-center space-x-2 bg-toss-red';
            verdictText.textContent = 'Toss';
            verdictIcon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>';
        } else {
            verdictPill.className = 'px-4 py-2 rounded-full font-semibold text-white text-lg flex items-center space-x-2 bg-brand';
            verdictText.textContent = 'Check it';
            verdictIcon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l3 3m0 0l3-3m-3 3V3"/></svg>';
        }
    }

    // Symptom check
    async function checkSymptom() {
        if (!currentFoodId) {
            symptomResult.classList.add('hidden');
            return;
        }
        const symptom = symptomInput.value.trim();
        if (!symptom) {
            symptomResult.classList.add('hidden');
            return;
        }
        try {
            const response = await fetch(`${baseUrl}/api/v1/foods/${currentFoodId}/symptom`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ symptom })
            });
            if (!response.ok) throw new Error('Symptom check failed');
            const data = await response.json(); // Expect {verdict, matched_signs[], explanation}
            symptomVerdict.textContent = data.verdict || '';
            symptomExplanation.textContent = data.explanation || '';
            symptomMatchedSigns.textContent = data.matched_signs && data.matched_signs.length ?
                `Matched signs: ${data.matched_signs.join(', ')}` : '';
            symptomResult.classList.remove('hidden');
        } catch (err) {
            console.error(err);
            symptomResult.classList.add('hidden');
        }
    }

    // Event listeners for keyboard navigation
    searchInput.addEventListener('keydown', handleKeyDown);
    // Click outside to hide chips/results? Not required.

    // Initialize
    init();
})();