Ekşi Seçki
==========

A Chrome extension for popular Turkish website [Ekşi Sözlük](https://eksisozluk.com). The extension suggests a personalized list of topics on Ekşi Sözlük, based on user's clicking behavior.

## Installation

Clone the repository:
```sh
git clone https://github.com/erdiaker/eksi-secki.git
```

Step into the install directory, install the dependencies, run the tests:
```sh
cd eksi-secki
npm install
npm test
```

Start Chrome. Open extension management page [chrome://extensions](chrome://extensions). Check "Developer mode" checkbox if it's not checked already. Click "Load unpacked extension" button, and choose the install directory to load the extension.   

## Usage

After loading the extension, go to https://eksisozluk.com, and you should see a 'seçki' button on the top navigation menu. It will suggest a list of topics if you click on it. Keep in mind that you should spend some time on web site for the extension to learn your preferences and make good suggestions. Have fun. 

