# LNCast - Lightning Network Podcatcher

[LNCast](https://lncast.com) leverages the Bitcoin Lightning Network to enable creators to monetize their podcasts with micropayments.

## How it Works

LNCast is a web application built on the [MEAN Stack](http://mean.io/). It uses [node-feedparser](https://github.com/danmactough/node-feedparser) to get podcast info from RSS feeds. LNCast supports micropayments and payouts on the [Bitcoin Testnet](https://en.bitcoin.it/wiki/Testnet) using [LND](https://github.com/lightningnetwork/lnd)'s [GRPC](https://grpc.io/) service.

## Demo
![Demo Payment GIF](https://media.giphy.com/media/xUNd9KyCXSvKuaPp1m/giphy.gif)

## Why Pay for Podcasts?

I am a huge fan of the podcast medium. Podcasts are a great way to learn or to be entertained when your brain would otherwise be idle.

As much as I like podcasts, I **hate** ads, and most podcasts are full of them. Those that aren't full of ads must either eat the cost of storage and bandwidth or rely on user donations through centralized services such as Patreon and PayPal, whose [fees](https://patreon.zendesk.com/hc/en-us/articles/204606125-How-do-you-calculate-fees-) limit the amount of money that actually gets to the creators and price out small donations.

With instant, trustless micropayments, listeners can pay directly to creators for an ad-free experience, by the episode, or even ([theoretically](https://docs.google.com/presentation/d/16BK53bnfRVu_iHJKw2f82DRg6kk8061gxiJeKTCciKY/edit#slide=id.g2005d26133_0_17)) by the second, supporting the podcast and improving their listening experience in the process.

My hope for this project is that it will highlight the value that the lighting network could bring to the podcast medium.

## Contributing

Please report any issues or desired features [on this repository](https://github.com/djseeds/lncast/issues).

Additionally, you are encouraged to contribute to the codebase by [submitting a pull request](https://github.com/djseeds/lncast/pulls).
