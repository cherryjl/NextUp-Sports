function googleTranslateElementInit() {
    new google.translate.TranslateElement(
        { pageLanguage: 'en',
            includedLanguages: 'en,es,zh-TW,fr,hi,ar,ru,de,ja,it,pt,ko',
            layout: google.translate.TranslateElement.InlineLayout.SIMPLE
        }, 'google_translate_element');
}