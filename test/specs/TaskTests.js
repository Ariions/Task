describe('Settings page funtionality', () => {
  before(async() => {
    //await driver.back(); we will go back if i dont see main page and no login page
    // should make sure i am in main page
  });

  it('navigate to settings page', async () => {
    const settingsButton = await $('xpath://*[contains(@content-desc, "settings")]'); // settings have no accesability id at least i cannot find it with release build
    await settingsButton.click();
    
    const settingsTitle = await $('~settingsMainViewTestID'); // enlgish and has no : bedfore TestID
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
  // i would continue this to check every page but it would not be different from examples above so i wont
  it('navigate back to main screen', async () => {
    const aboutButton = await $('~Navigate up'); // accesability id english and no : or testID
    await aboutButton.click();
  });

  // good place to check for correct version but that would require access to the git to check what is the newest version
});

// User can login  to his account (we will pass login) and order new VOD record 
describe('Order Vod recording functionality', () => {
  before(() => {
      
  });

  it('navigate to video and order Vod', async () => {
    const settingsButton = await $('xpath://*[contains(@content-desc, "settings")]'); // settings have no accesability id at least i cannot find it with release build
    await settingsButton.click();
    const additionalSettingsButton = await $('xpath://*[contains(@content-desc, "Kiti nustatymai:TestID")]'); // settings have no accesability id at least i cannot find it with release build
    await additionalSettingsButton.click();
    const channelSettingsButton = await $('~Kanalų nustatymai:TestID'); // settings have no accesability id at least i cannot find it with release build
    await channelSettingsButton.click();
    const vodToggle = await $('~settingsToggleTestID'); // settings have no accesability id at least i cannot find it with release build
    await vodToggle.click();
    const numberInput = await driver.$('~pinInputModalTestID');
    await numberInput.click();
    await driver.pressKeyCode(14);
    await driver.pressKeyCode(15);
    await driver.pressKeyCode(16);
    await driver.pressKeyCode(7);
    const comfirmButton = await $('~pinChange:confirm:TestID');
    await comfirmButton.click();   
  });

  it('check if vod is downloaded', async () => {
      
  });

  after(async() => {
   // await driver.closeApp();
});
});


const { expect } = require('chai');
const { createReadStream } = require('fs');
const PNG = require('pngjs').PNG;
const fs = require('fs');
const path = require('path');

describe('Screenshot Test', function () {
  let Dependency = false;
  before(async() => {
    //await driver.launchApp();
  });

  it('navigate to video', async () => { // was thinking of a specific video but might be better to do main promoted one
      const playButton = await $('~common:watch:TestID'); 
      await playButton.click();
      // TODO sometimes it fainds element below and sometimes dont need to make tis more consistant
      const settingsTitle = await $('xpath://*[contains(@content-desc, "videoScreenMainViewTestID")]'); // enlgish and has no : bedfore TestID 
      if (expect(await settingsTitle.isDisplayed()).to.be.true){
        Dependency = true;
      } else {
        throw new Error('Failed to navigate to video');
      }

  });
  
  // things i would want to still consider is there a loading cycle of death when telia fails to load a video
  it('check if stream is not full black', async function () {
    if (!Dependency) { // if we failed to reach video screen skip this
      this.skip();
    }

    await new Promise(resolve => setTimeout(resolve, 5000));
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
