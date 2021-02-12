import fetch from "node-fetch";
import fs from "fs";
import fsExtra from "fs-extra";

// yarn run ts-node -O '{"module": "commonjs"}' scripts/build-content.ts

interface Issue {
  id: number;
  name: string;
  reason: string;
  script: string;
  slug: string;
  createdAt: string;
  contactAreas: string[];
  outcomeModels: Outcome[];
  categories: Category[];
  active: boolean;
}

interface Category {
  name: string;
}

interface Outcome {
  label: string;
  status: string;
}

const buildContent = async () => {
  const contentDirectory = `${__dirname}/../../content/issue/`;
  fsExtra.emptyDirSync(contentDirectory);
  const doneDirectory = `${__dirname}/../../content/done/`;
  fsExtra.emptyDirSync(doneDirectory);

  fetch(`https://api.5calls.org/v1/issues`)
    .then((res) => res.json())
    .then((data) => {
      const issues = data as Issue[];
      console.log(`building content for ${issues.length} issues`);
      issues.forEach((issue) => {
        fs.writeFileSync(`${contentDirectory}${issue.slug}.md`, postContentFromIssue(issue));
      });
      // create the done pages too
      issues.forEach((issue) => {
        fs.writeFileSync(`${doneDirectory}${issue.slug}.md`, doneContentFromIssue(issue));
      });
    })
    .catch((error) => {
      console.error(`couldn't fetch issues: ${error}`);
    });
};

const postContentFromIssue = (issue: Issue): string => {
  return `---
title: "${escapeQuotes(issue.name)}"
date: ${issue.createdAt}
issueId: ${issue.id}
script: |
${multilineScript(issue.script)}
${contactAreaYAML(issue)}
${outcomesYAML(issue)}
${categoriesYAML(issue)}
active: ${issue.active ? "true" : "false"}
---
${issue.reason}
`;
};

const doneContentFromIssue = (issue: Issue): string => {
  return `---
title: "${escapeQuotes(issue.name)}"
date: ${issue.createdAt}
issueId: ${issue.id}
---
`;
};

const escapeQuotes = (text: string): string => {
  return text.replace(/"/g, '\\"');
};

const multilineScript = (text: string): string => {
  // multiline strings
  return text.replace(/^/gm, "  ");
};

const contactAreaYAML = (issue: Issue): string => {
  let contactAreasText = ``;

  if (issue.contactAreas.length > 0) {
    contactAreasText = `contactAreas:`;
    for (const contact of issue.contactAreas) {
      contactAreasText += `\r  - ${contact}`;
    }
  }

  return contactAreasText;
};

const outcomesYAML = (issue: Issue): string => {
  let outcomesText = ``;

  if (issue.outcomeModels.length > 0) {
    outcomesText = `outcomes:`;
    for (const outcome of issue.outcomeModels) {
      outcomesText += `\r  - ${outcome.label}`;
    }
  }

  return outcomesText;
};

const categoriesYAML = (issue: Issue): string => {
  let categoriesText = ``;

  if (issue.categories.length > 0) {
    categoriesText = `categories:`;
    for (const category of issue.categories) {
      categoriesText += `\r  - "${escapeQuotes(catNameTransform(category.name))}"`;
    }
  }

  return categoriesText;
};

const catNameTransform = (name: string): string => {
  return name
    .replace("-", " ")
    .split(" ")
    .map((w) => w[0].toUpperCase() + w.substr(1).toLowerCase())
    .join(" ");
};

buildContent();
