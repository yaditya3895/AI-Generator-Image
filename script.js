const themeToggle = document.querySelector(".theme-toggle");
const promptForm = document.querySelector(".prompt-form");
const promptInput = document.querySelector(".prompt-input");
const promptBtn = document.querySelector(".prompt-btn");

const modelSelect = document.getElementById("model-select");
const countSelect = document.getElementById("count-select");
const ratioSelect = document.getElementById("ratio-select");

const generateBtn = document.querySelector(".generate-btn");
const gridGallery = document.querySelector(".gallery-grid");

// ==========================
// Hugging Face API Key && AI native models are used in this project. You can get your API key from Hugging Face and replace the value below.
// ==========================
const API_KEY = "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";

// ==========================
// Example Prompts
// ==========================
const examplePrompts = [
  "A floating city above the clouds with crystal towers and golden sunlight",
  "A cyberpunk street in Tokyo at midnight with neon reflections",
  "An ancient dragon wrapped around a giant glowing tree",
  "A futuristic underwater city with glass domes",
  "A magical library floating in space with glowing books",
  "A samurai standing on a cliff during a thunderstorm",
  "A futuristic Mars colony surrounded by red mountains",
  "A wizard laboratory with floating potions and glowing runes",
  "A giant turtle carrying an entire kingdom on its shell",
  "A celestial dragon made entirely of galaxies"
];

// ==========================
// Theme Setup
// ==========================
(() => {
  const savedTheme = localStorage.getItem("theme");
  const prefersDark =
    window.matchMedia("(prefers-color-scheme: dark)").matches;

  const isDark =
    savedTheme === "dark" || (!savedTheme && prefersDark);

  document.body.classList.toggle("dark-theme", isDark);

  const icon = themeToggle.querySelector("i");
  icon.className = isDark
    ? "fa-solid fa-sun"
    : "fa-solid fa-moon";
})();

// ==========================
// Toggle Theme
// ==========================
function toggleTheme() {
  const isDark =
    document.body.classList.toggle("dark-theme");

  localStorage.setItem(
    "theme",
    isDark ? "dark" : "light"
  );

  const icon = themeToggle.querySelector("i");

  icon.className = isDark
    ? "fa-solid fa-sun"
    : "fa-solid fa-moon";
}

// ==========================
// Calculate Dimensions
// ==========================
function getImageDimensions(
  aspectRatio,
  baseSize = 512
) {
  const [widthRatio, heightRatio] =
    aspectRatio.replace(":", "/")
      .split("/")
      .map(Number);

  const scale =
    baseSize /
    Math.sqrt(widthRatio * heightRatio);

  let width =
    Math.round(widthRatio * scale);

  let height =
    Math.round(heightRatio * scale);

  width = Math.floor(width / 16) * 16;
  height = Math.floor(height / 16) * 16;

  return { width, height };
}

// ==========================
// Update Image Card
// ==========================
function updateImageCard(index, imageUrl) {
  const card =
    document.getElementById(`img-card-${index}`);

  if (!card) return;

  card.classList.remove("loading");

  card.innerHTML = `
    <img src="${imageUrl}" class="result-img" alt="Generated Image">

    <div class="img-overlay">
      <a href="${imageUrl}"
         download="image-${Date.now()}.png"
         class="img-download-btn">
        <i class="fa-solid fa-download"></i>
      </a>
    </div>
  `;
}

// ==========================
// Show Error
// ==========================
function showError(index, message) {
  const card =
    document.getElementById(`img-card-${index}`);

  if (!card) return;

  card.classList.remove("loading");

  card.innerHTML = `
    <div class="status-container">
      <i class="fa-solid fa-triangle-exclamation"></i>
      <p>${message}</p>
    </div>
  `;
}

// ==========================
// Generate Images
// ==========================
async function generateImages(
  selectedModel,
  imageCount,
  aspectRatio,
  promptText
) {
  const modelMap = {
    "black-forest-labs/FLUX.1-dev":
      "black-forest-labs/FLUX.1-schnell",

    "black-forest-labs/FLUX.1-schnell":
      "black-forest-labs/FLUX.1-schnell",

    "prompthero/openjourney":
      "black-forest-labs/FLUX.1-schnell"
  };

  const model =
    modelMap[selectedModel] ||
    "black-forest-labs/FLUX.1-schnell";

  const MODEL_URL =
    `https://router.huggingface.co/hf-inference/models/${model}`;

  const { width, height } =
    getImageDimensions(aspectRatio);

  try {
    generateBtn.disabled = true;

    generateBtn.innerHTML =
      '<i class="fa-solid fa-spinner fa-spin"></i> Generating...';

    const requests = Array.from(
      { length: imageCount },
      async (_, index) => {
        try {
          const response = await fetch(
            MODEL_URL,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${API_KEY}`,
                "Content-Type":
                  "application/json"
              },

              body: JSON.stringify({
                inputs: promptText,

                parameters: {
                  width,
                  height
                },

                options: {
                  wait_for_model: true,
                  use_cache: false
                }
              })
            }
          );

          if (!response.ok) {
            const error =
              await response.text();

            throw new Error(error);
          }

          const imageBlob =
            await response.blob();

          const imageUrl =
            URL.createObjectURL(imageBlob);

          updateImageCard(
            index,
            imageUrl
          );
        } catch (error) {
          console.error(error);

          showError(
            index,
            "Generation Failed"
          );
        }
      }
    );

    await Promise.allSettled(requests);
  } catch (error) {
    console.error(error);
  } finally {
    generateBtn.disabled = false;

    generateBtn.innerHTML =
      '<i class="fa-solid fa-wand-sparkles"></i> Generate';
  }
}

// ==========================
// Create Loading Cards
// ==========================
function createImageCards(
  selectedModel,
  imageCount,
  aspectRatio,
  promptText
) {
  gridGallery.innerHTML = "";

  for (let i = 0; i < imageCount; i++) {
    gridGallery.innerHTML += `
      <div
        class="img-card loading"
        id="img-card-${i}"
        style="aspect-ratio:${aspectRatio};"
      >
        <div class="status-container">
          <div class="spinner"></div>
          <p>Generating...</p>
        </div>
      </div>
    `;
  }

  generateImages(
    selectedModel,
    imageCount,
    aspectRatio,
    promptText
  );
}

// ==========================
// Form Submit
// ==========================
function handleFormSubmit(e) {
  e.preventDefault();

  const promptText =
    promptInput.value.trim();

  if (!promptText) {
    alert("Please enter a prompt");
    return;
  }

  const selectedModel =
    modelSelect.value;

  const imageCount =
    parseInt(countSelect.value) || 1;

  const aspectRatio =
    ratioSelect.value || "1/1";

  createImageCards(
    selectedModel,
    imageCount,
    aspectRatio,
    promptText
  );
}

// ==========================
// Random Prompt Button
// ==========================
promptBtn.addEventListener(
  "click",
  () => {
    const prompt =
      examplePrompts[
        Math.floor(
          Math.random() *
          examplePrompts.length
        )
      ];

    promptInput.value = prompt;
    promptInput.focus();
  }
);

// ==========================
// Event Listeners
// ==========================
promptForm.addEventListener(
  "submit",
  handleFormSubmit
);

themeToggle.addEventListener(
  "click",
  toggleTheme
);