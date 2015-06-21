var accel = 0;

var triggerLow = false, triggerLowTime = 0;
var triggerHigh = false, triggerHighTime = 0;

var movingLow = false;
var movingHigh = false;

var reachedZero = true;

var audioScroll = function(bandwidth){
    var diff = bandwidth.left - bandwidth.right;

    if (diff == 0)
        reachedZero = true;
    
    //cutoff
    if (diff <= 3 && diff >= -3)
        diff = 0;
    
    //moving cutoff
    if ((movingHigh || movingLow) && diff < 6 && diff > -6){   
        diff = 0;
    }
    
    if (!reachedZero){
        diff = 0;
        accel = 0;
    }
    
    if (diff <= -6){
        triggerLow = true;
        triggerLowTime = 15;
        
        if (movingHigh){
            movingHigh = false;
            reachedZero = false;
        }
        
        if (triggerHigh){
            movingLow = true;
        }
    } else {
        if (triggerLowTime > 0)
            triggerLowTime -= 1;
        else
            triggerLow = false;
    }
    
    if (diff >= 6){
        triggerHigh = true;
        triggerHighTime = 15;
        
        if (movingLow){
            movingLow = false;
            reachedZero = false;
        }
        
        if (triggerLow){
            movingHigh = true;
        }
    } else {
        if (triggerHighTime > 0)
            triggerHighTime -= 1;
        else
            triggerHigh = false;
    }
    
    accel += diff / 20;
    accel = accel * 0.99;
    
    if (movingHigh)
        accel = 3;
    else if (movingLow)
        accel = -3;
    
    window.scrollBy(0,accel);
}
