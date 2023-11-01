// User can login  to his account (we will pass login) and order new VOD record 
describe('Order Vod recording functionality', () => {
  before(() => {
      
  });

  it('navigate to settings and disable Vod with pin', async () => {
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
    await comfirmButton.click();  
    
    // check if toggle is disabled
    const isToggleEnabled = await vodToggle.getAttribute('checked');
    expect(isToggleEnabled).to.equal('false');


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
    
    // check if toggle is disabled
    const isToggleEnabled = await vodToggle.getAttribute('checked');
    expect(isToggleEnabled).to.equal('true');

    // exit out to main screen with 3 back gestures
    for(let  i= 0; i<3; i++) await driver.back();

  });

  after(async() => {
   // await driver.closeApp(); / i would reset app between states but i cannot deal with login
  });
});

describe('Program Content Validity', () => {

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

  async function scrollUp() {
    await driver.performActions([{
      type: 'pointer',
      id: 'finger1',
      parameters: { pointerType: 'touch' },
      actions: [
        { type: 'pointerMove', duration: 0, x: 582, y: 702 },
        { type: 'pointerDown', button: 0 },
        { type: 'pause', duration: 100 },
        { type: 'pointerMove', duration: 400, x: 604, y: 1266 },
        { type: 'pointerUp', button: 0 }
      ]
    }]);
  }

  async function scrollDown() {
    await driver.performActions([{
      type: 'pointer',
      id: 'finger1',
      parameters: { pointerType: 'touch' },
      actions: [
        { type: 'pointerMove', duration: 0, x: 582, y: 1266 },
        { type: 'pointerDown', button: 0 },
        { type: 'pause', duration: 100 },
        { type: 'pointerMove', duration: 250, x: 604, y: 702 },
        { type: 'pointerUp', button: 0 }
      ]
    }]);
  }

  async function scrapeText() {
    const titleSelector = '//android.widget.ScrollView/android.view.ViewGroup/android.view.ViewGroup/android.view.ViewGroup/android.widget.TextView';
    const timeSelector = '//android.widget.ScrollView/android.view.ViewGroup/android.view.ViewGroup/android.view.ViewGroup/android.view.ViewGroup/android.widget.TextView';

    const titleElements = await driver.$$(titleSelector);
    const timeElements = await driver.$$(timeSelector);

    const titles = await Promise.all(titleElements.map(async (el) => el.getText()));
    const times = await Promise.all(timeElements.map(async (el) => el.getText()));

    const combinedTexts = titles.map((title, index) => {
      const time = times[index];
      if (title && time && title !== '' && title !== 'TIESIOGIAI') {
        return `${title} - ${time}`;
      }
      return null;
    }).filter(text => text !== null);

    return combinedTexts;
  };


  it('should navigate to the bottom of Program page', async () => {
    if (!driver) {
      throw new Error('Driver is not initialized');
    }
    // Initialize variables to store scraped texts and track end of content
    let allTexts = new Set();
    let isAtEnd = false;

    // Scroll and scrape loop
    while (!isAtEnd) {
      const currentTexts = await scrapeText();
      const newTexts = currentTexts.filter(text => !allTexts.has(text));

      if (newTexts.length > 0) {
        newTexts.forEach(text => allTexts.add(text));
      } else {
        isAtEnd = true;
      }

      if (!isAtEnd) {
        await scrollDown();
      }
    }
  });

  it('should navigate to the top of Program page and scrape all the info', async () => {
    if (!driver) {
      throw new Error('Driver is not initialized');
    }
    // Initialize variables to store scraped texts and track end of content
    let allTexts = new Set();
    let isAtEnd = false;

    // Scroll and scrape loop
    while (!isAtEnd) {
      const currentTexts = await scrapeText();
      const newTexts = currentTexts.filter(text => !allTexts.has(text));

      if (newTexts.length > 0) {
        newTexts.forEach(text => allTexts.add(text));
      } else {
        isAtEnd = true;
      }

      if (!isAtEnd) {
        await scrollUp();
      }
    }
    // Convert Set to Array for easier processing or validation
    const scrapedTexts = Array.from(allTexts);
    console.log(scrapedTexts);
  });
});
/*
const { expect } = require('chai');
const { Console } = require('console');
const { createReadStream } = require('fs');
const PNG = require('pngjs').PNG;
const fs = require('fs');
const path = require('path');

describe('Is promoted video loaded and stream works', function () {
  let Dependency = false; // i use this to kill next test if first one fails

  before(async() => {
    
  });

  it('navigate to video', async () => { // was thinking of a specific video but might be better to do main promoted one
      const playButton = await $('~common:watch:TestID'); 
      await playButton.click();

      // not the most consistant part 
      const settingsTitle = await $('xpath://*[contains(@content-desc, "videoScreenMainViewTestID")]'); // enlgish and has no : bedfore TestID 
      await settingsTitle.waitForDisplayed({ timeout: 10000 });
      // ill need this test for another
      Dependency = expect(await settingsTitle.isDisplayed()).to.be.true;
      if (!Dependency){
        throw new Error('Failed to navigate to video');
      }
  });
  
  it('check if stream is not full black', async function () {
    if (!Dependency) { // if we failed to reach video screen skip this
      this.skip();
    }

    // giving time everything to load and start streaming might change to waitForExist reverse, for ui elements
    await new Promise(resolve => setTimeout(resolve, 5000));

    //check if video is loaded 
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
*/