document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("spiritual-articles");
  if (!container) return;

  const apiUrl =
    "https://api.github.com/repos/jasminthompsonjt-hub/Wellness-everyday-101/contents/content/spiritual/articles?ref=main";

  function parseEntry(text) {
    const parts = text.split("---");
    const frontMatter = parts.length >= 3 ? parts[1] : "";
    const body = parts.length >= 3 ? parts.slice(2).join("---").trim() : text.trim();

    const data = {};

    frontMatter.split("\n").forEach((line) => {
      const match = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
      if (!match) return;

      let value = match[2].trim();
      value = value.replace(/^["']|["']$/g, "");
      data[match[1]] = value;
    });

    return { data, body };
  }

  function escapeHtml(value = "") {
    return value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  try {
    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error("Could not load articles.");
    }

    const files = await response.json();

    const markdownFiles = files.filter(
      (file) => file.type === "file" && file.name.endsWith(".md")
    );

    const articles = await Promise.all(
      markdownFiles.map(async (file) => {
        const articleResponse = await fetch(file.download_url);
        const text = await articleResponse.text();
        return parseEntry(text);
      })
    );

    articles.sort((a, b) => {
      return new Date(b.data.date || 0) - new Date(a.data.date || 0);
    });

    if (!articles.length) {
      container.innerHTML =
        "<strong>Latest Articles & Reflections</strong><p>No articles have been published yet.</p>";
      return;
    }

    container.className = "";
    container.innerHTML =
      '<h3 style="margin-bottom:20px;">Latest Articles & Reflections</h3>';

    articles.forEach(({ data, body }) => {
      const image =
        data.image ||
        data.featured_image ||
        data.featuredImage ||
        data.featured ||
        "";

      const article = document.createElement("article");
      article.style.marginBottom = "32px";
      article.style.padding = "24px";
      article.style.borderRadius = "18px";
      article.style.background = "#ffffff";
      article.style.boxShadow = "0 8px 24px rgba(0,0,0,.08)";

      article.innerHTML = `
        ${
          image
            ? `<img src="${escapeHtml(image)}"
                 alt="${escapeHtml(data.title || "Spiritual wellness article")}"
                 style="width:100%;max-width:420px;height:auto;border-radius:14px;margin-bottom:18px;">`
            : ""
        }

        <h3>${escapeHtml(data.title || "Untitled Article")}</h3>

        ${
          data.date
            ? `<p style="font-size:.9rem;opacity:.7;">${new Date(
                data.date
              ).toLocaleDateString()}</p>`
            : ""
        }

        <p style="line-height:1.7;">${escapeHtml(body).replace(
          /\n+/g,
          "<br><br>"
        )}</p>
      `;

      container.appendChild(article);
    });
  } catch (error) {
    console.error(error);

    container.innerHTML = `
      <strong>Latest Articles & Reflections</strong>
      <p>Articles are temporarily unavailable. Please check back shortly.</p>
    `;
  }
});