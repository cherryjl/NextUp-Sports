let exportBtn = document.getElementById('exportData');

exportBtn.addEventListener('click', function () {
    let selectedSports = localStorage.getItem('selectedSports');
    let data = {};
    if (selectedSports) {
        data.selectedSports = JSON.parse(selectedSports);
    } else {
        data.selectedSports = [];
    }

    let jsonTxt = JSON.stringify(data, null, 2);

    let obj = 'data:text/json;charset=utf-8,' + encodeURIComponent(jsonTxt);
    let link = document.createElement('a');
    link.href = obj;
    link.download = 'user-filter-options.json';
    link.click();
});