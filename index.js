const fetch = require("node-fetch");
const { askQuestions } = require("./ask");
const puppeteer = require("puppeteer");
const fs = require("fs-extra");
const hbs = require("handlebars");
const path = require("path");
require("dotenv").config();

const url = process.env.GITHUB_API;

askQuestions([
  "Type a GitHub username: ",
  "What is your favourite colour? "
]).then(answers => {
  const user = answers[0];
  const backgroundColor = answers[1];

  const gitHubIcon =
    "https://res.cloudinary.com/ygiah/image/upload/v1574460349/bootcamp/github-alt-brands_1.svg";
  const locationIcon =
    "https://res.cloudinary.com/ygiah/image/upload/v1574460349/bootcamp/location-arrow-solid_1.svg";
  const blogIcon =
    "https://res.cloudinary.com/ygiah/image/upload/v1574460350/bootcamp/rss-solid_1.svg";
  const userInfo = fetch(`${url}/users/${user}`);

  userInfo
    .then(response => response.json())
    .then(res => {
      const data = {
        name: res.name,
        avatar: res.avatar_url,
        bio: res.bio,
        location: res.location,
        gitHub: res.html_url,
        blog: res.blog,
        company: res.company,
        publicRepos: res.public_repos,
        followers: res.followers,
        following: res.following,
        publicGists: res.public_gists,
        gitHubStars: res.starred_url
      };
      data.backgroundColor = backgroundColor;
      data.gitHubIcon = gitHubIcon;
      data.locationIcon = locationIcon;
      data.blogIcon = blogIcon;

      const starsUrl = data.gitHubStars;
      const newStarsUrl = starsUrl.split("{/owner}{/repo}").join("");
      const stars = fetch(newStarsUrl);

      stars
        .then(response => response.json())
        .then(pro => {
          const userStars = {
            stars: pro[0].stargazers_count
          };

          data.stars = userStars.stars;

          const compile = async function(templateName, data) {
            const filePath = path.join(
              process.cwd(),
              "template",
              `${templateName}.hbs`
            );
            const html = await fs.readFile(filePath, "utf-8");
            return hbs.compile(html)(data);
          };

          (async function() {
            try {
              const browser = await puppeteer.launch();
              const page = await browser.newPage();

              const content = await compile("profile-template", data);
              await page.setContent(content);

              await page.emulateMedia("screen");
              await page.pdf({
                path: "profile.pdf",
                format: "A4",
                printBackground: true
              });

              console.log("DONE");
              await browser.close();
              process.exit();
            } catch (error) {
              console.log("opps, I messed up again!", error);
            }
          })();
        });
    });
});
