var running = {};
var started = {};

chrome.browserAction.onClicked.addListener(function() {
    console.log("Injecting")
    chrome.tabs.getSelected(null, function(tab){
        console.log("Running: " + running[tab.id]);
        console.log("Started: " + started[tab.id])
        if (running[tab.id] == undefined && started[tab.id] == undefined){
            chrome.tabs.executeScript(tab.id, {file: "doppler.js"}, function(e){
                chrome.tabs.executeScript(tab.id, {file: "main.js"}, function(e){
                    chrome.tabs.executeScript(tab.id, {code: "doppler.init(audioScroll);"}, function(response) {
                        console.log(response);
                        started[tab.id] = true;
                        running[tab.id] = true;
                        chrome.browserAction.setIcon({path: "icon38.png"});
                    });
                });
            });
        } else if (running[tab.id]) {
            chrome.tabs.executeScript(tab.id, {code: "doppler.stop();"}, function(response) {
                running[tab.id] = false;
                chrome.browserAction.setIcon({path: "iconOff38.png"});
            });
        } else if (!running[tab.id]){
            chrome.tabs.executeScript(tab.id, {code: "doppler.init(audioScroll);"}, function(response) {
                running[tab.id] = true;
                chrome.browserAction.setIcon({path: "icon38.png"});
            });
        }
    });
});

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    console.log(tab);
    checkIcon(tab.id);
});

chrome.tabs.onCreated.addListener(function(tabId, changeInfo, tab) {  
    console.log(tab);
    checkIcon(tab.id);
});

chrome.tabs.onActivated.addListener(function(tabId, changeInfo, tab) {
    checkIcon(tabId.tabId);
});

var checkIcon = function(tabId){
    console.log(running[tabId]);
    if (running[tabId] == undefined || !running[tabId]){
        chrome.browserAction.setIcon({path: "iconOff38.png"});
    } else {
        chrome.browserAction.setIcon({path: "icon38.png"});   
    }
}