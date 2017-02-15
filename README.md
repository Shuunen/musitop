# Musitop

It delete music you don't like and move the one you want to keep.


## Install

Install npm dependencies and set your "input" music folder.

Optional : if you want to move your favorite music, set the "keep" music folder.


## Optional : add shortcut folder to your path

Edit your bashrc :
```
gedit ~/.bashrc
```
Add Musitop :
```
MUSITOP=/home/ME/Projects/musitop/shortcuts
PATH=$PATH:$MUSITOP

export PATH
```
And source :
```
source ~/.bashrc
```
Now you can easilly control Musitop wherever you are :
```
musinext
musigood
musibad
```

## Optional : configure media bindings

On Ubuntu, go to Keyboard > Custom shortcuts

Click on the "+" to add a new binding

Name it "Musitop Next" for example

And assign this command "bash /home/path-to-musitop/shortcuts/musinext.sh"

Now you can control Musitop with media bindings :)

## Use

Open command line and npm start.

Musitop will play music files found in input folder.

If you like or dislike, click on the appropriate icons, Musitop will delete bad music and move good music into "keep" folder.


## Huge thanks

* 1by1 : for their [great & lightweight music player](http://mpesch3.de1.cc/1by1.html)
* Aha-Soft : for [pretty icons](https://www.iconfinder.com/aha-soft)
* Artists : for creating amazing music
* Config-prompt : for their [configuration lib](https://github.com/ironSource/node-config-prompt)
* Electron : for their [app & idea](http://electron.atom.io/)
* Express : for their [easy & powerful node server framework](http://expressjs.com/)
* Es-lint : for [keeping the code clean](http://eslint.org/)
* Minimist : for [easy argument parsing](https://github.com/substack/minimist)
* Music-Metadata : for giving an [easy way to read metadata from mp3 files](https://github.com/leetreveil/musicmetadata)
* Node-notifier : for [handy desktop notification](https://github.com/mikaelbr/node-notifier)
* Shuffle-array : for [easy array shuffling](https://github.com/pazguille/shuffle-array)
* Socket IO : for their [web socket lib that's great to use](http://socket.io/) <3
* Vlc : for their [great music player](http://www.videolan.org/vlc/)


## Still to do

* server should use HTTPS
* server should redirects HTTP traffic to HTTPS
* server should use HTTP/2
* handle case when server shut down, avoid letting client playing or loading
* handle last music action, like a dropdown that will act on n-1 song : was good, was bad
* add pause icon in systray
* handle case when next track is no more on disk
* handle case when no music left in input folder
* handle case when no music left in playlist
* handle case when song cannot be moved (eg. when destination already exists)
* add a gif demo usage
