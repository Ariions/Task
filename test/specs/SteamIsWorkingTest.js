const chai = require('chai');
const expect = chai.expect;

describe('Is promoted video loaded and stream works @stage2', function () {
    const PNG = require('pngjs').PNG;
    const fs = require('fs');
    const path = require('path');


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
  