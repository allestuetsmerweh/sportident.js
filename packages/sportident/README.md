# `sportident` package

This package contains all platform-independent SportIdent logic.

It consists of the following modules:
- `SiCard`: All about SI cards: How to talk to the different versions of SI cards, how to postprocess results read from them, example contents of SI cards for testing and simulation, etc.
- `SiDevice`: All about how the computer platform interacts with the SI device: Interfaces that platform-specific device drivers need to implement (you will need to install at least one platform-specific driver for your app to work), some general functionality to manage the state and lifecycle of the SI device, some generic tests driver implementers can run on their code, etc.
- `simulation`: All about functionally testing assumptions about how all these devices work: Simulate a main station, simulate an SI card of any type, etc.
- `SiStation`: All about SI stations: How it can switch between direct (talk to the SI station connected to the computer) and remote (talk to the station coupled to the connected station) target, an abstraction layer to easily read/write information from/to either target station, handling SI cards inserted into the direct target station, example contents of SI stations for testing and simulation, etc.
- `storage`: A library to help interact with the storage of SI stations and SI cards: Easily declare which data is stored where and of what type that data is, transform data, etc.
- `utils`: Non-SportIdent-specific helper functions.
- `constants`: Constants.
- `siProtocol`: Helpers for the language that the SI device talks over the serial connection.
- `testUtils`: Helper functions for testing.
