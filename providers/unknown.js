
function unknownProvider(tab) {
    return {
        id: null,
        description: tab.title,
        url: tab.url,
        external_ids: null,
    };
}
