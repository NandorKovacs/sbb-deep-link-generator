const container = document.getElementById('stationsContainer');

// Initial setup
function init() {
    addStationField();
    addStationField();

    const inputs = document.querySelectorAll('input, select');
    inputs.forEach(input => {
        if (input.type === 'checkbox' || input.tagName === 'SELECT') {
            input.addEventListener('change', generateLink);
        } else {
            input.addEventListener('input', generateLink);
        }
    });

    generateLink();
}

function toggleAdvancedOptions() {
    const advancedOptions = document.getElementById('advancedOptions');
    const chevron = document.getElementById('advancedOptionsChevron');
    
    if (advancedOptions.classList.contains('hidden')) {
        advancedOptions.classList.remove('hidden');
        chevron.classList.add('rotate-90');
    } else {
        advancedOptions.classList.add('hidden');
        chevron.classList.remove('rotate-90');
    }
}

// Create a new input field row
function addStationField() {
    const wrapper = document.createElement('div');
    wrapper.className = "flex gap-2 fade-in station-row";
    
    const input = document.createElement('input');
    input.type = "text";
    input.placeholder = "Enter station name (e.g., Zurich HB or %s)";
    input.className = "station-input flex-1 bg-white border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors placeholder-slate-400";
    
    input.addEventListener('input', (e) => handleInput(e, 'main'));

    wrapper.appendChild(input);
    container.appendChild(wrapper);
}

function handleInput(e, type = 'main') {
    const currentContainer = container;
    const addFieldFn = addStationField;
    const minRows = 2;

    const rows = Array.from(currentContainer.querySelectorAll('.station-row'));
    const filledRows = [];
    const emptyRows = [];
    let focusedRow = null;

    // Classify rows
    rows.forEach(row => {
        const input = row.querySelector('input');
        if (input.value.trim() !== "") {
            filledRows.push(row);
        } else {
            emptyRows.push(row);
        }
        if (row.contains(document.activeElement)) {
            focusedRow = row;
        }
    });

    // Determine which empty rows to KEEP
    let emptyRowsToKeep = [];

    // 1. If the user is currently focused on an empty row, we must keep it
    if (focusedRow && emptyRows.includes(focusedRow)) {
        emptyRowsToKeep.push(focusedRow);
    } 
    // 2. If no empty row is focused, we keep the last empty row
    else if (emptyRows.length > 0) {
        emptyRowsToKeep.push(emptyRows[emptyRows.length - 1]);
    }

    // 3. Constraint: We need at least minRows rows total
    let currentTotal = filledRows.length + emptyRowsToKeep.length;
    
    if (currentTotal < minRows) {
        const needed = minRows - currentTotal;
        const availableToSalvage = emptyRows.filter(r => !emptyRowsToKeep.includes(r));
        
        for (let i = 0; i < needed; i++) {
            if (availableToSalvage.length > 0) {
                emptyRowsToKeep.push(availableToSalvage.pop());
            }
        }
    }

    // 4. Remove the empty rows that didn't make the cut
    emptyRows.forEach(r => {
        if (!emptyRowsToKeep.includes(r)) {
            r.remove();
        }
    });

    // 5. Check if we need to add a new row
    const finalRows = Array.from(currentContainer.querySelectorAll('.station-row'));
    
    if (finalRows.length > 0) {
        const lastRow = finalRows[finalRows.length - 1];
        const lastInput = lastRow.querySelector('input');
        if (lastInput.value.trim() !== "") {
            addFieldFn();
        }
    } else {
        for(let i = 0; i < minRows; i++) {
            addFieldFn();
        }
    }
    
    // 6. Final safety check for min-2 constraint
    const checkRowsCount = currentContainer.querySelectorAll('.station-row').length;
    if (checkRowsCount < minRows) {
        addFieldFn();
    }

    generateLink();
}

function generateLink() {
    const inputs = document.querySelectorAll('.station-input');
    const date = document.getElementById('dateInput').value;
    const time = document.getElementById('timeInput').value;
    const moment = document.getElementById('momentSelect').value;
    const lang = document.getElementById('langSelect').value;
    const errorDiv = document.getElementById('errorMsg');
    const resultContainer = document.getElementById('resultContainer');
    const output = document.getElementById('outputResult');
    const outputDecoded = document.getElementById('outputResultDecoded');
    const resultContainerDecoded = document.getElementById('resultContainerDecoded');
    const transportModeCheckboxes = document.querySelectorAll('input[name="transportMode"]:checked');
    const walkSpeed = document.getElementById('walkSpeedSelect').value;
    const directConnection = document.getElementById('directConnectionCheckbox').checked;
    const economicConnection = document.getElementById('economicConnectionCheckbox').checked;
    const unsharpConnection = document.getElementById('unsharpConnectionCheckbox').checked;
    const showAccessibility = document.getElementById('showAccessibilityCheckbox').checked;
    const hidePrices = document.getElementById('hidePricesCheckbox').checked;
    const accessibilityCheckboxes = document.querySelectorAll('input[name="filterAccessibility"]:checked');
    const occupancy = document.getElementById('occupancySelect').value;
    const attributeCheckboxes = document.querySelectorAll('input[name="attribute"]:checked');

    // 1. Collect Valid Stops
    let stops = [];
    let validCount = 0;

    inputs.forEach((input, index) => {
        const val = input.value.trim();
        if (val) {
            validCount++;

            stops.push({
                label: val,
                type: "ID",
                value: ""
            });
        }
    });

    // 2. Collect Transport Modes
    let transportModes = [];
    transportModeCheckboxes.forEach(checkbox => {
        transportModes.push(checkbox.value);
    });

    // 3. Collect Accessibility Filters
    let accessibilityFilters = [];
    accessibilityCheckboxes.forEach(checkbox => {
        accessibilityFilters.push(checkbox.value);
    });

    // 4. Collect Attributes
    let attributes = [];
    attributeCheckboxes.forEach(checkbox => {
        attributes.push(checkbox.value);
    });

    // 5. Validation
    errorDiv.classList.add('hidden');
    resultContainer.classList.add('hidden');
    resultContainerDecoded.classList.add('hidden'); // Hide decoded container initially

    if (validCount === 0) {
        showError("Please enter at least one station.");
        return;
    }

    // 6. Construct Query
    const stopsJson = JSON.stringify(stops);
    
    // Construct base URL
    let baseUrl = `https://www.sbb.ch/${lang}?stops=${encodeURIComponent(stopsJson).replace(/%25s/g, '%s')}`;

    let decodedUrl = `https://www.sbb.ch/${lang}?stops=${stopsJson}`;


    if (transportModes.length > 0) {
        baseUrl += `&transportModes=${transportModes.join(',')}`;
        decodedUrl += `&transportModes=${transportModes.join(',')}`;
    }

    if (walkSpeed) {
        baseUrl += `&walkSpeed=${walkSpeed}`;
        decodedUrl += `&walkSpeed=${walkSpeed}`;
    }

    if (directConnection) {
        baseUrl += `&directConnection=true`;
        decodedUrl += `&directConnection=true`;
    }

    if (economicConnection) {
        baseUrl += `&includeEconomic=true`;
        decodedUrl += `&includeEconomic=true`;
    }

    if (unsharpConnection) {
        baseUrl += `&includeUnsharp=true`;
        decodedUrl += `&includeUnsharp=true`;
    }

    if (showAccessibility) {
        baseUrl += `&showAccessibility=true`;
        decodedUrl += `&showAccessibility=true`;
    }

    if (hidePrices) {
        baseUrl += `&hidePrices=true`;
        decodedUrl += `&hidePrices=true`;
    }

    if (accessibilityFilters.length > 0) {
        baseUrl += `&filterAccessibility=${accessibilityFilters.join(',')}`;
        decodedUrl += `&filterAccessibility=${accessibilityFilters.join(',')}`;
    }

    if (occupancy) {
        baseUrl += `&occupancy=${occupancy}`;
        decodedUrl += `&occupancy=${occupancy}`;
    }

    if (attributes.length > 0) {
        baseUrl += `&attributes=${attributes.join(',')}`;
        decodedUrl += `&attributes=${attributes.join(',')}`;
    }

    if (date) {
        baseUrl += `&date="${date}"`;
        decodedUrl += `&date="${date}"`;
    }
    
    if (time) {
        baseUrl += `&time="${time}"`;
        decodedUrl += `&time="${time}"`;
    }

    baseUrl += `&moment="${moment}"`;
    decodedUrl += `&moment="${moment}"`;

    // 7. Output
    output.value = baseUrl;
    outputDecoded.value = decodedUrl;
    resultContainer.classList.remove('hidden');
    resultContainerDecoded.classList.remove('hidden');
}

function showError(msg) {
    const el = document.getElementById('errorMsg');
    el.innerText = msg;
    el.classList.remove('hidden');
}

function copyToClipboard(elementId) {
    const copyText = document.getElementById(elementId);
    copyText.select();
    copyText.setSelectionRange(0, 99999); 
    document.execCommand("copy");
    
    const btn = document.querySelector(`button[onclick="copyToClipboard('${elementId}')"]`);
    const originalText = btn.innerText;
    btn.innerText = "Copied!";
    setTimeout(() => btn.innerText = originalText, 2000);
}

// Run init
init();