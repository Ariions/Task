const chai = require('chai');
const expect = chai.expect;

// 1 Test to disable vod and reenable it 
describe('@stage1 Disable Vod recording functionality and check if it doesnt work', () => {
  // 1.1 navigating to settings page and waiting for it to be displayed
  it('navigate to settings page', async () => {
    const settingsButton = await $('xpath://*[contains(@content-desc, "settings")]'); // settings have no accesability id at least i cannot find it with release build
    await settingsButton.click();
    
    const settingsTitle = await $('~settingsMainViewTestID'); // english and has no : bedfore TestID
    await settingsTitle.waitForDisplayed({ timeout: 500 }); 
    
    expect(await settingsTitle.isDisplayed()).to.be.true;
  });

  // 1.2 checking if all buttons are created
  it('check if settings page has all the content', async () => {
    const languageChangeButton = await $('~Kalbos pasirinkimas:TestID'); // lithuanian and has :
    const moreSettingsButton = await $('~Kiti nustatymai:TestID');
    const aboutButton = await $('~Apie:TestID');
    
    expect(await languageChangeButton.isDisplayed()).to.be.true;
    expect(await moreSettingsButton.isDisplayed()).to.be.true;
    expect(await aboutButton.isDisplayed()).to.be.true;
  });

  // 1.3 disabling vod with a pin
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

  // 1.4 going to a tv show that will be shown to ckeck if we will get a recoding
  it('confirm if vod is disabled', async () => {

    // this promotional message is bane of this test it happens one an hour or so as i cant reset i have to just check for it
    let  promotionalMessage;
    /* i need this for not a testing build and it takes quite a bit of time
    try {
      promotionalMessage = await $('~Aktyvuokite nemokamą TV įrašų funkcionalumą:TestID');
      await promotionalMessage.isExisting({ waitforTimeout: 500, waitforInterval: 0 });
    } catch (error) {
      console.log('Loading message is not present, continuing the test...');
    }
    if (promotionalMessage) {
      const closePromotionalMessageButton =   await $('//android.widget.FrameLayout[@resource-id="android:id/content"]/android.widget.FrameLayout/android.view.ViewGroup/android.view.ViewGroup/android.view.ViewGroup[2]/android.view.ViewGroup[1]/android.view.ViewGroup/android.view.ViewGroup/android.view.ViewGroup/android.view.ViewGroup[1]/android.view.ViewGroup/android.widget.TextView');
      if(closePromotionalMessageButton) await closePromotionalMessageButton.click();  
    }
    */
    const tvChannelsButton = await $('~TV Kanalai:TestID'); 
    await tvChannelsButton.click();

    const additionalSettingsButton = await $('xpath://*[contains(@text, "Programa")]');// TVProgramme:TestID was not consistant between pages
    await additionalSettingsButton.waitForDisplayed({ timeout: 500 });
    await additionalSettingsButton.click();

    // this most definetly could be done better but for now it works
    const nextProgrammeInfoButton = await $('//android.widget.ScrollView/android.view.ViewGroup/android.view.ViewGroup[9]');
    await nextProgrammeInfoButton.click();

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

  // 1.5 reseting stats this would be done by app reset but then i would get pin with capcha
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
});

// 2 Test for what is diplayed in a tv promrames schedule
describe('@stage1 LRT Programm Content validity', () => {
  const { convertToMinutes, sortEntriesByStartTime, scrollUp, scrollDown, scrapeText } = require('../../additional scripts/helperFunctions');
  
  // 2.1 we navigate to the schedule
  it('navigate to Programm page', async () => {
    const tvChannelsButton = await $('~TV Kanalai:TestID');
    await tvChannelsButton.click();

    const additionalSettingsButton = await $('xpath://*[contains(@text, "Programa")]');
    await additionalSettingsButton.waitForDisplayed({ timeout: 500 });
    await additionalSettingsButton.click();
  });

  // we move dont to the end of the page (easier to go down as top has refresh function)
  it('should navigate to the bottom of Program page', async () => {
    if (!driver) {
      throw new Error('Driver is not initialized');
    }
    // Initialize variables to store scraped texts and track end of content
    let tempAllEntries = new Map();
    let isAtEnd = false;

    // Scroll and scrape loop
    while (!isAtEnd) {
      const currentEntries = await scrapeText(driver);
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

  // go slowly go up scraping all the data that is from the new tile maching, and sorting it by correct order
  let sortedEntries; // i will use final map in the other test
  
  it('should navigate to the top of Program page and scrape all the info', async () => {
    if (!driver) {
      throw new Error('Driver is not initialized');
    }
    
    // Initialize variables to store scraped texts and track end of content
    let allEntries = new Map();
    let isAtEnd = false;
  
    // Scroll and scrape loop
    while (!isAtEnd) {
      const currentEntries = await scrapeText(driver);
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
  });

  // 2.3 we check if tv programme 1 end time is the same as tv programme 2 start time for all of them this ensures no gaps or climbing over each others time 
  it('should ensure that entries are sequentially ordered without gaps', () => {
    for (let i = 0; i < sortedEntries.length - 1; i++) {
      const currentEntry = sortedEntries[i];
      const nextEntry = sortedEntries[i + 1];
  
      const currentEndTime = convertToMinutes(currentEntry.endTime);
      const nextStartTime = convertToMinutes(nextEntry.startTime);
  
      console.log(`Entry ${i}: "${currentEntry.title}" ends at ${currentEntry.endTime} (${currentEndTime} minutes), and Entry ${i+1}: "${nextEntry.title}" starts at ${nextEntry.startTime} (${nextStartTime} minutes)`);
      expect(currentEndTime).equal(nextStartTime);
    }
  });

  after(async () => {
    const homeButton = await $('~Home:TestID');
    await homeButton.waitForDisplayed({ timeout: 1000 });
    await homeButton.click();
  });
});

// 3 test that goes to the current live tv recording and checks if additional info is correct
describe('@stage2 Is Current programme description is correct and video shown is the same time as the indicator', function () {
  const { scrapeText, convertToMinutes, getFormattedDate } = require('../../additional scripts/helperFunctions');
  if (!driver) {
    throw new Error('Driver is not initialized');
  }
  // 3.1 simple navigate to the programme
  it('navigate to Programme page', async () => {
    const tvChannelsButton = await $('~TV Kanalai:TestID');
    await tvChannelsButton.click();

    const programmesButton = await $('xpath://*[contains(@text, "Programa")]');
    await programmesButton.waitForDisplayed({ timeout: 1000 });
    await programmesButton.click();
  });

  // i will scrape information in one test so if there is a failed test it is more clear why
  let liveProgrammeInfo;
  let liveIndexes;
  let Dependency = false;

  // 3.2 we find Live programme and scrape its data also confirming that there is a live programme
  it('check that current channel has a live programme', async () => {
    const LiveText = await $('xpath://*[contains(@content-desc, "Tiesiogiai:TestID")]');
    Dependency = await LiveText.waitForDisplayed({ timeout: 5000 });
    //await LiveText.click();

    // get scraped text
    const result = await scrapeText(driver, true);
    liveProgrammeInfo = result.combinedTexts;
    liveIndexes = result.liveIndexes;

    console.log(liveProgrammeInfo);
    console.log(liveIndexes);
  });

  // 3.3 we take gathered info and double check it with the info page for live programme 
  it('navigate to info panel and check if infromation is correct', async () => {
    if (!Dependency) { // if we failed to reach video screen skip this
      this.skip();
    }

    const firstLiveIndex = liveIndexes[0];
    const firstliveProgrammeInfo = liveProgrammeInfo[0];
    
    const LiveBoxSelector = `//android.widget.ScrollView/android.view.ViewGroup/android.view.ViewGroup[${firstLiveIndex.groupIndex+1}]`;
    const liveBox = await $(LiveBoxSelector);
    await liveBox.click();
    /* title i have also has genre that complicates things alot
    //craft what id should be and check if we can find sush id
    const titleId = `~${firstliveProgrammeInfo.title}:TestID`

    const programmeTitle = await $(titleId); 
    await programmeTitle.waitForDisplayed({ timeout: 500 }); 
    expect(await programmeTitle.isDisplayed()).to.be.true;
    */

    // correct date start time and duration is displayed
    const timeID = `~${getFormattedDate()} ${firstliveProgrammeInfo.startTime} · ${convertToMinutes(firstliveProgrammeInfo.endTime) - convertToMinutes(firstliveProgrammeInfo.startTime)} min:TestID`;
    console.log(timeID);
    const programmeInfo = await $(timeID); 
    await programmeInfo.waitForDisplayed({ timeout: 500 }); 
    expect(await programmeInfo.isDisplayed()).to.be.true;

  });

  // this would be a good place to go watch is and check if it is okay but because 
  // 4th test suite is very similar in nature i didnt want to double up same code too much


  // again we just go back to the start
  after(async () => {
    await driver.back();
    const homeButton = await $('~Home:TestID');
    await homeButton.waitForDisplayed({ timeout: 1000 });
    await homeButton.click();
  });
});

// NOTE!!! screenshot now only works with emulator as i need app premition to take a screenshot and it is not in telia.apk manifest
// also i need premition to read and write into external storage testing pc in this case
// 4 Test to load a video stream and check if it is loaded, if it doesnt have still loading message, and stream itself isnt black frame
describe('@stage2 Is promoted video loaded and stream works', function () {
    const PNG = require('pngjs').PNG;
    const fs = require('fs');
    const path = require('path');

    let Dependency = false; // i use this to kill next test if first one fails
  
    // 4.1 we navigate to video and launch it try
    it('navigate to video', async () => { // was thinking of a specific video but might be better to do main promoted one
        const playButton = await $('~common:watch:TestID'); 
        await playButton.click();
  
        // not the most consistant part 
        const VideoScreen = await $('xpath://*[contains(@content-desc, "videoScreenMainViewTestID")]'); // enlgish and has no : bedfore TestID 
        await VideoScreen.waitForDisplayed({ timeout: 10000 });
        // ill need this test for another
        Dependency = expect(await VideoScreen.isDisplayed()).to.be.true;
        if (!Dependency){
          throw new Error('Failed to navigate to video');
        }
    });
    
    //4.2 if previous test is seccessful we move on to this one and check if there is no still loading screen after we take a new screenshot and check it
    it('check if stream is not full black', async function () {
      if (!Dependency) { // if we failed to reach video screen skip this
        this.skip();
      }
  
      // giving time everything to load and start streaming might change to waitForExist reverse, for ui elements
      //await new Promise(resolve => setTimeout(resolve, 5000));
  
      //check if video is loaded it takes alot of time but at least in teory we neeed that time to make sure we gave time to load a video 
      let  loadingMessage;
      try {
        loadingMessage = await $('xpath://*[contains(@text, "Vaizdo peržiūra ruošiama")]');
        await loadingMessage.isExisting({ waitforTimeout: 0, waitforInterval: 0 });
      } catch (error) {
        console.log('Loading message is not present, continuing the test...');
      }
      
      if (loadingMessage) {
        const isDisplayed = await loadingMessage.isDisplayed();
        expect(isDisplayed).to.be.false;
      }
      
      // after waiting for interface to fade and checking if video is loaded with no loading message we take a screenshot
      const screenshot = await driver.takeScreenshot();
      const screenshotPath = path.join(__dirname, 'screenshot.png')
  
      // delete privious screenshot so it would be impossible accidently checking previous one
      if (fs.existsSync(screenshotPath)) {
        fs.unlinkSync(screenshotPath);
      }
  
      fs.writeFileSync(screenshotPath, screenshot, 'base64');
      // The screenshot is taken and returned as a base64 encoded PNG
      const buffer = Buffer.from(screenshot, 'base64');
  
      // with some help from internet we check evry pixel of screenshot for the first non black one and if we found suck a pixel we exit with a pass
      const isNotBlack = await new Promise((resolve) => { 
        const png = new PNG();
        png.parse(buffer, function (error) {
          if (error) return reject(new Error(`Failed to parse image: ${error.message}`)); 
          let notBlackPixelFound = false;
          for (let y = 0; y < png.height; y++) {
            for (let x = 0; x < png.width; x++) {
              const idx = (png.width * y + x) << 2;
              if (png.data[idx] !== 0 || png.data[idx + 1] !== 0 || png.data[idx + 2] !== 0) {
                notBlackPixelFound = true;
                break;
              }
            }
            if (notBlackPixelFound) break;
          }
  
          resolve(notBlackPixelFound);
        });
      });
  
      expect(isNotBlack).to.be.true;
    });
  
    // after all tests done we close an app
    after(async() => {
        await driver.closeApp();
    });
  });
  
