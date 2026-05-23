    function addDigit(digit) {
        if (currentInput === "0") currentInput = digit;
        else if (currentInput.length < 4) currentInput += digit;
        updateNumpad();
    }

    function clearDisplay() { currentInput = "0"; updateNumpad(); }
    function popDigit() { currentInput = currentInput.length > 1 ? currentInput.slice(0, -1) : "0"; updateNumpad(); }
    function updateNumpad() { document.getElementById('numpadDisplay').innerText = currentInput; }

    window.addDigit = addDigit;
    window.clearDisplay = clearDisplay;
    window.popDigit = popDigit;
    window.updateNumpad = updateNumpad;