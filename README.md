# AudioScroll-Extension
A Chrome extension to scroll webpages using hand gestures picked up by a microphone

# How it works
Once enabled on a chrome tab, a sine wave with a high frequency is emmitted. The sound bounces around the room and is picked up by the microphone. Moving your hand towards or away from the microphone changes the frequency of the sound waves slightly due to the doppler effect. This is measured and used to scroll the webpage.

# doppler.js
The doppler.js library was created by Daniel Rapp and can be viewed on GitHub [here](https://github.com/DanielRapp/doppler). It has been slightly modified to allow for stopping and restarting.
