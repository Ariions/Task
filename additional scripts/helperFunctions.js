const chai = require('chai');
const expect = chai.expect;

function convertToMinutes(time) {
  const [hours, minutes] = time.trim().split(':').map(Number);
  return Number(hours * 60 + minutes);
}

function getFormattedDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
  
function sortEntriesByStartTime(entries) {
  return entries.sort((a, b) => {
    const timeA = a.startTime.split(':').map(Number);
    const timeB = b.startTime.split(':').map(Number);
    const hoursComparison = timeA[0] - timeB[0];
    if (hoursComparison !== 0) return hoursComparison;
    return timeA[1] - timeB[1];
  });
}

async function scrollUp(driver) {
  await driver.performActions([{
    type: 'pointer',
    id: 'finger1',
    parameters: { pointerType: 'touch' },
    actions: [
      { type: 'pointerMove', duration: 0, x: 582, y: 702 },
      { type: 'pointerDown', button: 0 },
      { type: 'pointerMove', duration: 250, x: 604, y: 1266 },
      { type: 'pointerUp', button: 0 }
    ]
  }]);
}

async function scrollDown(driver) {
  await driver.performActions([{
    type: 'pointer',
    id: 'finger1',
    parameters: { pointerType: 'touch' },
    actions: [
      { type: 'pointerMove', duration: 0, x: 582, y: 1266 },
      { type: 'pointerDown', button: 0 },
      { type: 'pointerMove', duration: 100, x: 604, y: 702 },
      { type: 'pointerUp', button: 0 }
    ]
  }]);
}

function parseScheduleEntry(entry) {
  const regex = /^(\d{2}:\d{2}) - (\d{2}:\d{2}) - (.*)$/;
  const match = entry.match(regex);

  if (!match) {
    console.error(`Entry does not match the expected format: ${entry}`);
    return null;
  }

  const [, startTime, endTime, title] = match;
  return { title, startTime, endTime };
}

async function scrapeText(driver, justLive = false) {
  const pairsOfParents = [
    [2, 2], [4, 2], [6, 2]
  ];

  const combinedTexts = [];
  const liveIndexes = [];

  for (const [groupIndex, childIndex] of pairsOfParents) {
    const liveIndicatorSelector = `//android.widget.ScrollView/android.view.ViewGroup/android.view.ViewGroup[${groupIndex}]/android.view.ViewGroup[${childIndex + 1}]/android.widget.TextView[@content-desc='Tiesiogiai:TestID']`;
    const titleSelector = `//android.widget.ScrollView/android.view.ViewGroup/android.view.ViewGroup[${groupIndex}]/android.view.ViewGroup[${childIndex}]/android.view.ViewGroup/android.widget.TextView`;
    const timeSelector = `//android.widget.ScrollView/android.view.ViewGroup/android.view.ViewGroup[${groupIndex}]/android.view.ViewGroup[${childIndex}]/android.widget.TextView`;

    let proceed = true;
    if (justLive) {
      const liveIndicatorElement = await driver.$(liveIndicatorSelector);
      const isLiveIndicatorDisplayed = await liveIndicatorElement.isDisplayed();
      proceed = isLiveIndicatorDisplayed;
      if (proceed) {
        liveIndexes.push({ groupIndex, childIndex });
      }
    }

    if (proceed) {
      const titleElement = await driver.$(titleSelector);
      const timeElement = await driver.$(timeSelector);

      const isTitleDisplayed = await titleElement.isDisplayed();
      const isTimeDisplayed = await timeElement.isDisplayed();

      if (isTitleDisplayed && isTimeDisplayed) {
        const title = await titleElement.getText();
        const time = await timeElement.getText();

        if (title && time && title !== '' && title !== 'TIESIOGIAI') {
          const entry = parseScheduleEntry(`${title} - ${time}`);
          if (entry) {
            combinedTexts.push(entry);
          }
        }
      } else {
        console.log(`Elements not displayed for parent at index [${groupIndex}, ${childIndex}], skipping...`);
      }
    } else {
      console.log(`Live indicator not found or not live for parent at index [${groupIndex}, ${childIndex + 1}], skipping...`);
    }
  }

  if (justLive) {
    return { combinedTexts, liveIndexes };
  } else {
    return { combinedTexts };
  }
};

module.exports = {
  convertToMinutes,
  getFormattedDate,
  sortEntriesByStartTime,
  scrollUp,
  scrollDown,
  scrapeText
};