<p align="center">
  <a href="https://github.com/liscioapps/getsphere">  </a>

  <img src="https://getsphere.dev/img/main_wordmark.png" alt="Sphere icon">


  <h2 align="center">Effortlessly centralize community, product, and customer data</h2>
  
  <p align="center">
    <br>
    <a href="https://app.getsphere.dev/auth/signup">🌐 Cloud version (beta)</a>
    ·
    <a href="https://docs.getsphere.dev">📖 Docs</a>
    <!-- ·
    <a href="https://getsphere.dev/discord">❤️ Discord</a>
    ·
    <a href="https://getsphere.dev/newsletter-sign-up">📣 Newsletter</a>
    ·
    <a href="https://getsphere.dev/roadmap">🗺️ Roadmap</a> -->
  </p>
</p>

<br>

<!-- BODY -->

<img src="https://getsphere.dev/img/screenshot02.png" alt="UI Home screen">


## Table of Contents
- [About Sphere](#about-sphere)
- [Features](#features)
- [Getting started](#getting-started)
- [Roadmap](#roadmap)
- [Stay up-to-date](#stay-up-to-date)
- [Contribution](#contribution)
- [License](#license)
- [Security](#security)
- [Book a call](#book-a-call)

## About Sphere
Sphere (getsphere.dev) is a community-driven fork of the crowd.dev project. Sphere is a Developer Data Platform (DDP) that allows companies to centralize all touch points developers have with their product and brand, whether in the community (e.g., Stack Overflow or Reddit), product (open-source or SaaS), or commercial channels (e.g., HubSpot). The platform pulls data from various sources, normalizes it, matches identities across platforms, and enriches it with third-party data. The result is a unified 360-degree view of the developers who engage with your product and community, the companies they work for, and their position in their personal customer journey.

Sphere is open-source, built with developers in mind, available for both hosted and self-hosted deployments, open to extensions, and offers full control over your data.

**To our users:**
- You can get actively involved, contribute to our roadmap, and turn Sphere into the tool you've always wanted.
- We are open about what we are building, allowing you to take a look inside, and ensuring that we handle your data in a privacy-preserving way.
- Our interests as a community are aligned with yours, and we need to ensure that we always deliver enough value to you with our offerings.

**To our developer community:**
- You can self-host Sphere to centralize data for your community or company while keeping full control over your data.
- Our product is built for extensibility. If you can think of any use cases that you want to build with the data we collect and store for you, please go ahead and build them! We will be here to help out if you need us.
- You can actively contribute to Sphere (e.g., integrations), and we will be supporting you along the journey. Just take a look at our [Contributing guide](https://github.com/SphereDev/Sphere/blob/main/CONTRIBUTING.md).

## Features

- **Plug & play integrations** to tie all relevant platforms - like GitHub, Discord, Slack, or LinkedIn - together. ([all integrations](https://www.getsphere.dev/integrations))
- **Identity resolution & automated segmentation** to effortlessly understand activities and profiles across platforms.
- **Opinionated analytics & reports** on topics like product-market-fit and open-source community activity to further inform your GTM strategy.
- **Workflows automation** with webhooks.
- **2-way CRM sync & Slack alerts** to get notified about intent events in real-time. [cloud only]
- **User enrichment** with 25+ attributes, including emails, social profiles, work experience, and technical skills. [cloud only]
- **Organization enrichment** with 50+ attributes, including industry, headcount, and revenue. [cloud only]
- **Sentiment analysis and conversation detection** to stay on top of what's going on in your open-source community. [cloud only]

## Getting started

### Cloud version

Our <a href="https://app.getsphere.dev/">cloud version</a> is a fast, easy, and free way to get started with Sphere.

### Self-hosted version

To get started with self-hosting, take a look at our [self-hosting docs](./technical-docs/development-and-deployment.md).

#### Integrations

We currently support all our integrations for self-hosting. For each one of them, you will need to create your own application.

### Development environment

#### <a name="requirements">Requirements</a>

- [Node](https://nodejs.org/en) v16.16.0
- [Docker](https://docs.docker.com/get-docker/) and [docker-compose](https://docs.docker.com/compose/install/)

#### <a name="getting_started">Getting started</a>

1. Get the mono repo from GitHub

```shell
git clone git@github.com:SphereDev/Sphere.git
```

2. Run the start script

```shell
cd scripts
./cli start
```

3. For hot reloading, you can run

``` shell
cd scripts
./cli clean-start-dev
```

4. This app will be available at http://localhost:8081

For more information on development, you can <a href="https://docs.getsphere.dev/docs/docker-compose-single-machine-development-with-docker-images">check our docs</a>.

## Contribution
There are many ways you can contribute to Sphere! Here are a few options:

## Star this repo
Create issues every time you feel something is missing or goes wrong
Upvote issues with 👍 reaction so we know what's the demand for a particular issue to prioritize it within the roadmap
If you would like to contribute to the development of the project, please refer to our Contributing guide.

All contributions are highly appreciated. 🙏

## License
Distributed under the Apache 2.0 License. See [LICENSE](./LICENSE) for more information.

Our self-hosted version can be run and deployed by default under the permissive Apache 2.0 license. Preimum features from the previous CrowdDotDev version have been removed to be able to license the entire stack of GetSphere un the Apache 2.0 license.

## Security
We take security very seriously. If you come across any security vulnerabilities, please disclose them by sending an email to support@liscioapps.com. We appreciate your help in making our platform as secure as possible and are committed to working with you to resolve any issues quickly and efficiently.

