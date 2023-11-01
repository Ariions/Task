describe('Disable Vod recording functionality and check if it doesnt work @stage1', () => {
  const chai = require('chai');
  const expect = chai.expect;

  before(() => {
      
  });

  it('navigate to settings page', async () => {
    const settingsButton = await $('xpath://*[contains(@content-desc, "settings")]'); // settings have no accesability id at least i cannot find it with release build
    await settingsButton.click();
    
    const settingsTitle = await $('~settingsMainViewTestID'); // english and has no : bedfore TestID
    await settingsTitle.waitForDisplayed({ timeout: 100 }); 
    
    expect(await settingsTitle.isDisplayed()).to.be.true;
  });

  it('check if settings page has all the content', async () => {
    //TODO:: add all buttons
    const languageChangeButton = await $('~Kalbos pasirinkimas:TestID'); // lithuanian and has :
    const moreSettingsButton = await $('~Kiti nustatymai:TestID');
    const aboutButton = await $('~Apie:TestID');
    
    expect(await languageChangeButton.isDisplayed()).to.be.true;
    expect(await moreSettingsButton.isDisplayed()).to.be.true;
    expect(await aboutButton.isDisplayed()).to.be.true;
  });

  it('continue to settings and disable Vod with pin', async () => {
    // move to more settings
    const additionalSettingsButton = await $('xpath://*[contains(@content-desc, "Kiti nustatymai:TestID")]');
    await additionalSettingsButton.click();

    // open channel setting
    const channelSettingsButton = await $('~Kanalų nustatymai:TestID'); 
    await channelSettingsButton.click();

    // toggle VOD toggle
    const vodToggle = await $('~settingsToggleTestID'); 
    await vodToggle.click();

    // select first input square 
    const numberInput = await driver.$('~pinInputModalTestID');
    await numberInput.waitForDisplayed({ timeout: 500 });// to prevent typing until it is displayd
    await numberInput.click();

    await driver.waitUntil(async () => {
      const visible = await driver.execute('mobile: isKeyboardShown');
      return visible;
    }, 2000, 'Keyboard did not appear');

    // ideally i would encrypt this, but i didnt want to spend time on this yet, first wanna finish other tests and cosidering this is an internal testing file should be fine without any encryption
    await driver.pressKeyCode(14);
    await driver.pressKeyCode(15);
    await driver.pressKeyCode(16);
    await driver.pressKeyCode(7);

    // comfirm input
    const comfirmButton = await $('~pinChange:confirm:TestID');
    await comfirmButton.waitForDisplayed({ timeout: 500 });
    await comfirmButton.click();  
    
    // exit out to main screen with 3 back gestures
    for(let  i= 0; i<3; i++) await driver.back();

  });

  it('confirm if vod is disabled', async () => {
    const tvChannelsButton = await $('~TV Kanalai:TestID'); 
    await tvChannelsButton.click();

    const additionalSettingsButton = await $('xpath://*[contains(@text, "Programa")]');// TVProgramme:TestID was not consistant between pages
    await additionalSettingsButton.waitForDisplayed({ timeout: 500 });
    await additionalSettingsButton.click();

    // this most definetly could be done better but for now it works
    const nextProgrameInfoButton = await $('//android.widget.ScrollView/android.view.ViewGroup/android.view.ViewGroup[9]');
    await nextProgrameInfoButton.click();

    let  RemoveVodButton;
    try {
      RemoveVodButton = await $('~tvRecordings:refuseRecording:TestID');
      await RemoveVodButton.waitForExist({ timeout: 100 });
    } catch (error) {
      console.log('Remove VOD message is not present, continuing the test...');
    }

    await driver.back();

    const homeButton = await $('~Home:TestID');
    await homeButton.waitForDisplayed({ timeout: 500 });
    await homeButton.click();
  });

  it('navigate to settings and enable Vod again', async () => {
    // open settings
    const settingsButton = await $('xpath://*[contains(@content-desc, "settings")]'); // settings have no accesability id at least i cannot find it with release build
    await settingsButton.click();

    // move to more settings
    const additionalSettingsButton = await $('xpath://*[contains(@content-desc, "Kiti nustatymai:TestID")]');
    await additionalSettingsButton.click();

    // open channel setting
    const channelSettingsButton = await $('~Kanalų nustatymai:TestID'); 
    await channelSettingsButton.click();

    // toggle VOD toggle
    const vodToggle = await $('~settingsToggleTestID'); 
    await vodToggle.click();

    // exit out to main screen with 3 back gestures
    for(let  i= 0; i<3; i++) await driver.back();

  });

  after(async() => {
   // await driver.closeApp(); / i would reset app between states but i cannot deal with login
  });
});

describe('LRT Program Content validity @stage1', () => {
  const { convertToMinutes, sortEntriesByStartTime, scrollUp, scrollDown } = require('../../additional scripts/helperFunctions');

  before(async () => {
    // Setup code if needed
  });

  it('navigate to Program page', async () => {
    const tvChannelsButton = await $('~TV Kanalai:TestID');
    await tvChannelsButton.click();

    const additionalSettingsButton = await $('xpath://*[contains(@text, "Programa")]');
    await additionalSettingsButton.waitForDisplayed({ timeout: 500 });
    await additionalSettingsButton.click();
  });

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


  async function scrapeText() {
    const pairsOfParents = [
      [2, 2], [4, 2], [6, 2]
    ];
  
    const combinedTexts = [];
  
    for (const [groupIndex, childIndex] of pairsOfParents) {
      const titleSelector = `//android.widget.ScrollView/android.view.ViewGroup/android.view.ViewGroup[${groupIndex}]/android.view.ViewGroup[${childIndex}]/android.view.ViewGroup/android.widget.TextView`;
      const timeSelector = `//android.widget.ScrollView/android.view.ViewGroup/android.view.ViewGroup[${groupIndex}]/android.view.ViewGroup[${childIndex}]/android.widget.TextView`;
  
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
    }
  
    return combinedTexts;
  };



  it('should navigate to the bottom of Program page', async () => {
    if (!driver) {
      throw new Error('Driver is not initialized');
    }
    // Initialize variables to store scraped texts and track end of content
    let tempAllEntries = new Map();
    let isAtEnd = false;

    // Scroll and scrape loop
    while (!isAtEnd) {
      const currentEntries = await scrapeText();
      let newEntryAdded = false;

      for (const entry of currentEntries) {
        const entryKey = `${entry.title}-${entry.startTime}-${entry.endTime}`;
        
        if (!tempAllEntries.has(entryKey)) {
          tempAllEntries.set(entryKey, entry);
          newEntryAdded = true;
        }
      }

      if (!newEntryAdded) {
        isAtEnd = true;
      } else {
        await scrollDown(driver);
      }
    }
  });

  let sortedEntries; // i will use final data in the other test
  
  it('should navigate to the top of Program page and scrape all the info', async () => {
    if (!driver) {
      throw new Error('Driver is not initialized');
    }
    
    // Initialize variables to store scraped texts and track end of content
    let allEntries = new Map();
    let isAtEnd = false;
  
    // Scroll and scrape loop
    while (!isAtEnd) {
      const currentEntries = await scrapeText();
      let newEntryAdded = false;
  
      for (const entry of currentEntries) {
        const entryKey = `${entry.title}-${entry.startTime}-${entry.endTime}`;
        
        if (!allEntries.has(entryKey)) {
          allEntries.set(entryKey, entry);
          newEntryAdded = true;
        }
      }
  
      if (!newEntryAdded) {
        isAtEnd = true;
      } else {
        await scrollUp(driver);
      }
    }
  
    /// Convert Map to Array for easier processing or validation
    const scrapedEntries = Array.from(allEntries.values());

    // Use the separate function to sort the entries
    sortedEntries = sortEntriesByStartTime(scrapedEntries);

    console.log(sortedEntries);
  });

  it('should ensure that entries are sequentially ordered without gaps', () => {
    for (let i = 0; i < sortedEntries.length - 1; i++) {
      const currentEntry = sortedEntries[i];
      const nextEntry = sortedEntries[i + 1];
  
      const currentEndTime = convertToMinutes(currentEntry.endTime);
      const nextStartTime = convertToMinutes(nextEntry.startTime);
  
      try {
        expect(currentEndTime).toEqual(nextStartTime);
        console.log(`Entry ${i}: "${currentEntry.title}" ends at ${currentEntry.endTime}, and Entry ${i+1}: "${nextEntry.title}" starts at ${nextEntry.startTime} - Test Passed`);
      } catch (error) {
        console.error(`Entry ${i}: "${currentEntry.title}" ends at ${currentEntry.endTime}, but Entry ${i+1}: "${nextEntry.title}" starts at ${nextEntry.startTime} - Test Failed`);
      }
    }
  });

  after(async () => {
    const homeButton = await $('~Home:TestID');
    await homeButton.waitForDisplayed({ timeout: 500 });
    await homeButton.click();
  });

});
