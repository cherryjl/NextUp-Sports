document.addEventListener("DOMContentLoaded", () => {
  const uploadInput = document.getElementById("bg-upload");
  const previewImg = document.getElementById("bg-preview");
  const clearBtn = document.getElementById("clear-bg");
  const randomBtn = document.getElementById("random-bg");

  // Load existing background from storage
  const savedBg = localStorage.getItem("calendarBackground");
  if (savedBg) {
    previewImg.src = savedBg;
    previewImg.style.display = "block";
  }

  // Upload new image
  uploadInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const imageData = reader.result;
      previewImg.src = imageData;
      previewImg.style.display = "block";
      localStorage.setItem("calendarBackground", imageData);
      alert("Background image saved!");
    };
    reader.readAsDataURL(file);
  });

  // Remove saved background
  clearBtn.addEventListener("click", () => {
    localStorage.removeItem("calendarBackground");
    previewImg.src = "";
    previewImg.style.display = "none";
    alert("Background image removed.");
  });

  // Selects a random background image from online sources
  randomBtn.addEventListener("click", async () => {
    try {
      const screenW = window.innerWidth;
      const screenH = window.innerHeight;

      // Randomly choose a source
      const sources = ["picsum", "loremflickr-nature"];
      const choice = sources[Math.floor(Math.random() * sources.length)];

      let url;

      switch (choice) {
        case "picsum":
          url = `https://picsum.photos/${screenW}/${screenH}`;
          break;
        case "loremflickr-nature":
          url = `https://loremflickr.com/${screenW}/${screenH}/nature`;
          break;
      }

      // Fetch the image blob
      const response = await fetch(url);
      const blob = await response.blob();

      // Convert blob → Base64 for localStorage
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result;

        previewImg.src = base64data;
        previewImg.style.display = "block";

        localStorage.setItem("calendarBackground", base64data);

        alert(`Random background applied from ${choice}!`);
      };
      reader.readAsDataURL(blob);

    } catch (error) {
      console.error("Random background error:", error);
      alert("Failed to load a random background.");
    }
  });
});
