import i18next from 'i18next';


(async () => {
    await i18next.init({
        lng: 'en', // if you're using a language detector, do not define the lng option
        // debug: true,
        resources: {
            en: {
                translation: {
                    "a": "hello ${vars.region}",
                    "b": "hi-${vars.service}-01",
                    "c": "hi-01"
                }
            }
        },
        interpolation:{
            prefix: "${",
            suffix: "}"
        }
    });
    // initialized and ready to go!
    const obj = {
        vars:{
            region: 'cn-hangzhou',
            service: 'shl-service'
        }
    }
    console.log(i18next.t('a', obj));
    console.log(i18next.t('b', obj));
    console.log(i18next.t('c', obj));

})()