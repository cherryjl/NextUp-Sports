let importBtn = document.getElementById('importData');

importBtn.addEventListener('change', function () {
    try {
        let file = importBtn.files[0];
        const reader = new FileReader();
        reader.addEventListener('load', function () {
            let text = reader.result;
            let parsed = JSON.parse(text);
            let filteredArr = parsed.selectedSports;

            localStorage.setItem('selectedSports', JSON.stringify(filteredArr));

            let checkboxes = document.querySelectorAll("#favSports input[type='checkbox']");

            for (let i = 0; i < checkboxes.length; i++) {
                let box = checkboxes[i];
                if (filteredArr.indexOf(box.value) !== -1) {
                    box.checked = true;
                } else {
                    box.checked = false;
                }
            };
        });

        reader.readAsText(file);

    } catch (error) {
        console.error("Error importing JSON:", error);
    }
});