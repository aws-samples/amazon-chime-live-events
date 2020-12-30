# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: Apache-2.0

FROM ubuntu:20.04

ENV DEBIAN_FRONTEND noninteractive

RUN /usr/bin/apt-get update &&  /usr/bin/apt-get upgrade -y && /usr/bin/apt-get install -y \
        pulseaudio \
        xvfb \
        firefox \
        ffmpeg \
        xdotool \
        curl \
        unzip

COPY run.sh /
RUN chmod +x /run.sh

ENTRYPOINT ["/run.sh"]
