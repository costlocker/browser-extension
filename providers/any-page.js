
function anyPageProvider(tab) {
    return {
        id: null,
        description: tab.title,
        external_ids: {
            url: tab.url,
        },
    };
}
