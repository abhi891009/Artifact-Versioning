const core = require('@actions/core');
const { execSync } = require('child_process');
const fs = require('fs');
 
// Get latest git tag
function getLatestTag() {
  try {
    return execSync('git describe --tags --abbrev=0').toString().trim();
  } catch {
    return 'v0.0.0'; // fallback if no tag exists
  }
}
 
// Get commit messages since last tag
function getCommitMessages(sinceTag) {
  const log = execSync(`git log ${sinceTag}..HEAD --pretty=format:%s`).toString();
  return log.split('\n');
}
 
// Bump version according to semantic versioning
function bumpVersion(current, commits) {
  let [major, minor, patch] = current.replace('v', '').split('.').map(Number);
 
  let shouldBumpMajor = false;
  let shouldBumpMinor = false;
  let shouldBumpPatch = false;
 
  for (const msg of commits) {
    if (msg.includes('BREAKING CHANGE') || msg.startsWith('feat!:')) {
      shouldBumpMajor = true;
    } else if (msg.startsWith('feat')) {
      shouldBumpMinor = true;
    } else if (msg.startsWith('fix')) {
      shouldBumpPatch = true;
    }
  }
 
  if (shouldBumpMajor) {
    major++;
    minor = 0;
    patch = 0;
  } else if (shouldBumpMinor) {
    minor++;
    patch = 0;
  } else if (shouldBumpPatch) {
    patch++;
  }
 
  return `v${major}.${minor}.${patch}`;
}
 
// Main execution
async function run() {
  try {
    const latestTag = getLatestTag();
    const commits = getCommitMessages(latestTag);
 
    const newVersion = bumpVersion(latestTag, commits);
 
    // Create Git tag and push
    execSync(`git config user.name "github-actions"`);
    execSync(`git config user.email "github-actions@github.com"`);
    execSync(`git tag ${newVersion}`);
    execSync(`git push origin ${newVersion}`);
 
    core.setOutput('version', newVersion);
    console.log(`New version: ${newVersion}`);
  } catch (error) {
    core.setFailed(error.message);
  }
}
 
run();