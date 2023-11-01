function convertToMinutes(time) {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
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
        { type: 'pointerMove', duration: 250, x: 604, y: 702 },
        { type: 'pointerUp', button: 0 }
      ]
    }]);
  }

  module.exports = {
    convertToMinutes,
    sortEntriesByStartTime,
    scrollUp,
    scrollDown
  };