/**
* Copyright (c) [2019] SUSE Linux
*
* This software may be modified and distributed under the terms
* of the MIT license.  See the LICENSE.txt file for details.
*/

/**
 * This module offers an API to interact with a Janus server.
 *
 * @todo Read configuration.
 */
import { createRoomService } from './room-service';
import { createFeedsService } from './feeds-service';
import { createLogService } from './log-service';
import { createEventsService } from './events-service';
import { createDataChannelService } from './data-channel-service';
import { createActionService } from './action-service';
import { createFeed } from './models/feed';

// TODO: get this value from the configuration
const DEFAULT_URL = 'ws://localhost:8188/janus';

export default (function () {
  var that = {
    dataChannelService: null,
    eventsService: null,
    feedsService: null,
    logService: null,
    roomService: null,
    actionService: null
  };

  that.setup = function(options = {}) {
    let defaultUrl = options.serverUrl || DEFAULT_URL;

    that.eventsService = createEventsService();
    that.eventsService.getEventsSubject().subscribe((e) =>console.log("events subject", e)
    );
    that.feedsService = createFeedsService();
    that.logService = createLogService();
    that.dataChannelService = createDataChannelService(that.feedsService, that.logService);

    const createFeedFactory = createFeed(that.dataChannelService, that.eventsService);
    that.actionService = createActionService(
      that.feedsService,
      that.logService,
      that.dataChannelService,
      createFeedFactory
    );
    that.roomService = createRoomService(
      { janusServer: defaultUrl },
      that.feedsService,
      that.dataChannelService,
      that.eventsService,
      that.actionService
    );
  };

  that.getRooms = () => that.roomService.getRooms();
  that.enterRoom = (room, username) => {
    that.roomService.setRoom(room);
    return that.roomService.enter(username);
  };

  return that;
})();
