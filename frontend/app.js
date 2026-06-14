/* PantryOracle Frontend Logic */
(function () {
    const baseUrl = ''; // same origin

    const searchInput = document.getElementById('search-input');
    const clearButton = document.getElementById('clear-button');
    const searchResults = document.getElementById('search-results');
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

    // Debounce helper
    function debounce(fn, delay) {
        let timeoutId;
        return function (...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => fn.apply(this, args), delay);
        };
    }

    // Show loading skeleton
    function showLoading() {
        loadingSkeleton.classList.remove('hidden');
        verdictContent.classList.add('hidden');
        verdictCard.classList.remove('hidden');
    }

    // Hide loading, show content
    function hideLoading() {
        loadingSkeleton.classList.add('hidden');
        verdictContent.classList.remove('hidden');
    }

    // Hide verdict card
    function hideVerdict() {
        verdictCard.classList.add('hidden');
    }

    // Render verdict pill based on toss_rule or other logic
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

    // Populate verdict card with data
    function populateVerdict(data) {
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
        // Show content
        hideLoading();
    }

    // Fetch food by ID
    async function fetchFoodById(id) {
        try {
            const response = await fetch(`${baseUrl}/api/v1/foods/${id}`);
            if (!response.ok) throw new Error('Food not found');
            const data = await response.json();
            populateVerdict(data);
        } catch (err) {
            console.error(err);
            hideLoading();
            verdictCard.classList.add('hidden');
            // Show not found state? We'll just hide.
        }
    }

    // Search foods by query
    async function searchFoods(query) {
        if (!query.trim()) {
            searchResults.classList.add('hidden');
            return;
        }
        try {
            const response = await fetch(`${baseUrl}/api/v1/foods?q=${encodeURIComponent(query)}`);
            if (!response.ok) throw new Error('Search failed');
            const data = await response.json(); // Expect array of {id, name, category}
            renderSearchResults(data);
        } catch (err) {
            console.error(err);
            searchResults.classList.add('hidden');
        }
    }

    // Render search results list
    function renderSearchResults(foods) {
        searchResults.innerHTML = '';
        if (foods.length === 0) {
            const li = document.createElement('li');
            li.className = 'p-4 text-muted text-center';
            li.textContent = 'We don’t have that one yet';
            searchResults.appendChild(li);
            searchResults.classList.remove('hidden');
            return;
        }
        foods.forEach(food => {
            const li = document.createElement('li');
            li.className = 'flex items-center justify-between p-4 cursor-pointer hover:bg-surface/50 transition-colors';
            li.dataset.id = food.id;
            li.innerHTML = `
                <div class="flex-1 min-w-0">
                    <div class="text-ink font-medium">${food.name}</div>
                    <div class="text-sm text-muted">${food.category || ''}</div>
                </div>
                <svg class="h-4 w-4 text-muted" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
            `;
            li.addEventListener('click', () => {
                searchInput.value = food.name;
                searchResults.classList.add('hidden');
                clearButton.style.display = 'block';
                showLoading();
                fetchFoodById(food.id);
            });
            searchResults.appendChild(li);
        });
        searchResults.classList.remove('hidden');
    }

    // Handle symptom check
    async function checkSymptom() {
        const symptom = symptomInput.value.trim();
        if (!symptom) return;
        // We need the currently displayed food ID; we don't have it stored.
        // For simplicity, we'll assume we need to send symptom to a generic endpoint? 
        // According to API: POST /api/v1/foods/{id}/symptom
        // We don't have ID. We'll need to store current food ID.
        // We'll modify: when we fetch food, store currentFoodId.
        // We'll add a variable.
        // For now, we'll skip if no current food.
        if (!window.currentFoodId) {
            symptomResult.classList.add('hidden');
            return;
        }
        try {
            const response = await fetch(`${baseUrl}/api/v1/foods/${window.currentFoodId}/symptom`, {
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

    // Event listeners
    const debouncedSearch = debounce((e) => {
        const query = e.target.value;
        if (query) {
            clearButton.style.display = query ? 'block' : 'none';
            searchFoods(query);
        } else {
            searchResults.classList.add('hidden');
            clearButton.style.display = 'none';
            hideVerdict();
        }
    }, 200);

    searchInput.addEventListener('input', debouncedSearch);
    searchInput.addEventListener('focus', () => {
        if (searchInput.value) {
            searchResults.classList.remove('hidden');
        }
    });
    searchInput.addEventListener('blur', () => {
        // Keep results open if clicking on a result? We'll hide after a delay.
        setTimeout(() => {
            if (!searchResults.matches(':hover')) {
                searchResults.classList.add('hidden');
            }
        }, 200);
    });

    clearButton.addEventListener('click', () => {
        searchInput.value = '';
        clearButton.style.display = 'none';
        searchResults.classList.add('hidden');
        hideVerdict();
        symptomResult.classList.add('hidden');
        symptomInput.value = '';
        window.currentFoodId = null;
    });

    document.addEventListener('click', (e) => {
        if (!searchResults.contains(e.target) && e.target !== searchInput) {
            searchResults.classList.add('hidden');
        }
    });

    symptomButton.addEventListener('click', checkSymptom);
    symptomInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            checkSymptom();
        }
    });

    // When we fetch food, store its ID
    // Override fetchFoodById to set window.currentFoodId
    const originalFetchFoodById = fetchFoodById;
    fetchFoodById = async function (id) {
        window.currentFoodId = id;
        await originalFetchFoodById(id);
    };

    // Initialize: show example chips? Not implemented; we can leave as is.
    // For now, we just have empty state.
    // Optionally, we can preload some example foods and show as chips.
    // We'll skip for brevity.

    // Hide verdict card initially
    hideVerdict();
})();