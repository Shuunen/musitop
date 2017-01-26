# by default, script is executed in directory where it is called
# so... call this shell script like :
# sh /home/YOU/Projects/musitop/shortcuts/musinext.sh

HERE=$(dirname $0)
cd $HERE/..
node client.js --musicIs=next

#date > $HERE/musinext.log
#whereis node >> $HERE/musinext.log
# if node is not find maybe you'll need to make it globally available :
# sudo ln -s /home/romain/.nvm/versions/node/v4.6.0/bin/node /usr/bin/node

