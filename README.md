LNCast is a [podcatcher](https://en.wikipedia.org/wiki/List_of_podcatchers) that allows creators to monetize their podcasts using micropayments on the [Lightning Network](https://lightning.network/): a second layer on top of Bitcoin that enables instant, trustless micropayments.

While being focused on podcasts, LNCast is a proof of concept for a broader idea: mircropayments in exchange for data.

# Motivation

The truth is: podcasting costs money. Storage and bandwidth can [quickly add up](https://www.thepodcasthost.com/planning/cost-of-podcasting/), forcing creators to either eat the costs or look for some source of funding.
## Existing Funding Models

### Advertisements
- Ads are the most common way for creators to monetize their podcasts. I probably don't need to tell you why ads suck, but here it is anyways:
- Bad user experience: nobody wants their favorite podcast to be interrupted by yet another [Squarespace plug](https://www.theatlantic.com/business/archive/2015/05/why-so-many-podcasts-are-brought-to-you-by-squarespace/392840/).
- Favor popular podcasts: advertisers naturally prefer popular podcasts, which leaves niche or up-and-coming podcasts out in the cold.
- Time-consuming: instead of focusing on creating great content, creators must spend time seeking sponsors and creating ads.

### Crowdfunding
Crowdfunding allows passionate listeners to support their favorite podcasts using cold, hard cash. Crowdfunding improves upon the user experience of advertisements, but it still has major flaws:

- High minimum contribution: most crowdfunding sites have a high minimum contribution, which prevents the possibility of many listeners contributing small amounts.
- User effort: in order to contribute, users must navigate to an external website and enter their payment details. This added effort may dissuade some listeners from contributing.
- Fees: crowdfunding sites add [another layer of fees](https://support.patreon.com/hc/en-us/articles/204606125-How-do-you-calculate-fees-) atop already-high [payment processor fees](https://www.paypal.com/ag/selfhelp/article/what-are-the-fees-for-paypal-accounts-faq690). These fees limit the amount of money that reaches creators and once again disincentivizes small contributions.
- Risk of Deplatforming: Crowdfunding sites have recently [deplatformed some users](https://news.vice.com/en_us/article/qvqeev/crowdfunding-site-patreon-is-purging-far-right-figures), leaving them without the ability to fund their creations.

## Funding with Micropayments on Lightning

Micropayments on Lightning offer a far superior funding model for creators and listeners alike. Contrasting with the above funding models, there are obvious advantages to this model:

- No need for ads: when users can pay 1.5 cents for an episode ([the cost-per-listen of a typical podcast ad](https://www.advertisecast.com/podcast-advertising-rates)), creators can afford to have no ads.
- Low fees: with [near-zero fees](https://bitcoinmagazine.com/articles/bitcoin-lightning-network-creators-fees-will-be-effectively-zero-1459955513/), users can be sure that their money is going to support creators, not for the maintenance and profit of legacy banking networks.
- Low minimum payment: with payments as small as 1 satoshi (0.00000001 bitcoin), listeners are free to contribute small amounts of money, which can add up to large contributions.
- Simple user experience: with [one-click payments](https://twitter.com/alexbosworth/status/929937928519761921), little added effort will be required from users.
- Agnostic to popularity: whether a podcast has millions of listeners or a single listener, creators can raise the money needed to support their podcast.

# Lightning Network Wallets

LNCast is compatible with all [BOLT](https://github.com/lightningnetwork/lightning-rfc)-compliant lightning implementations.
If you are comfortable with the command line, you can use any of the three implementations directly:

- [LND](https://github.com/lightningnetwork/lnd)
- [Eclair](https://github.com/ACINQ/eclair)
- [c-lightning](https://github.com/ElementsProject/lightning)

You can also any of the more user-friendly lightning wallets, including:

- [Zap](https://zap.jackmallers.com/)
- [lightning-app](https://github.com/lightninglabs/lightning-app/releases)
- [Eclair Android](https://play.google.com/store/apps/details?id=fr.acinq.eclair.wallet.mainnet2)

