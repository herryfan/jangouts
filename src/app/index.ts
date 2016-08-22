/*
 * Copyright (C) 2015 SUSE Linux
 *
 * This software may be modified and distributed under the terms
 * of the MIT license.  See the LICENSE.txt file for details.
 */

/*
 * Error with the exported typings from zone.js
 * https://github.com/angular/zone.js/issues/297#issuecomment-200912405
 */
import "zone.js/dist/zone";
import "zone.js/dist/long-stack-trace-zone";

import "reflect-metadata";
import { upgradeAdapter } from "./adapter";

require("./vendor.scss");
require("./index.scss");

upgradeAdapter.upgradeNg1Provider("hotkeys"); // needed for pushToTalk

/* Register providers for browser, this is mandatory. */
// [TODO] - Activate when remove angular1
 /*import {MODAL_BROWSER_PROVIDERS} from 'angular2-modal/platform-browser';
 for (let p of MODAL_BROWSER_PROVIDERS) {
 	upgradeAdapter.addProvider(p);
}*/

import { ConfigService } from "./config.provider";
upgradeAdapter.addProvider(ConfigService);
let configModule: any = angular.module("janusHangouts.config", [])
    .service("jhConfig", upgradeAdapter.downgradeNg2Provider(ConfigService));

/* Register providers */
import { FEED_PROVIDERS } from "./feed";
for (let p of FEED_PROVIDERS) {
	upgradeAdapter.addProvider(p);
}
import { UserService } from "./user";
upgradeAdapter.addProvider(UserService);

/* Components */
import roomComponent from "./room";
import routerComponent from "./router";
import userComponent from "./user";
import footerComponent from "./footer";

angular.module("janusHangouts", [
    "ngAnimate",
    "ngCookies",
    "ngTouch",
    "ngSanitize",
    "ui.router",
    "ui.bootstrap",
    "cfp.hotkeys",
    "ngAudio",
    configModule.name,
    roomComponent.name,
    routerComponent.name,
    userComponent.name,
    footerComponent.name
  ])
  .config(routesConfig)
  .config(decorators)
  .run(getConfig)
  .run(stateEvents);

routesConfig.$inject = ["$stateProvider", "$urlRouterProvider"];
function routesConfig($stateProvider: any, $urlRouterProvider: any): void {
  $stateProvider
    .state("signin", {
      url: "/sign_in?room",
      template: "<div id='signin'><jh-signin-form></jh-signin-form></div>",
      resolve: {
        StatesService: "StatesService",
        setRoomAndService: ["StatesService", "$state", function (StatesService: any, $state: any): void {
          return StatesService.setRoomAndUser($state.toParams);
        }]
      }
    })
    .state("room", {
      url: "/rooms/:room?user",
      template: "<jh-room></jh-room>",
      resolve: {
        StatesService: "StatesService",
        setRoomAndService: ["StatesService", "$state", function (StatesService: any, $state: any): void {
          return StatesService.setRoomAndUser($state.toParams);
        }]
      }
    });

	$urlRouterProvider.otherwise("/sign_in");
}

decorators.$inject = ["$provide"];
function decorators($provide: any): void {
  /* Decorate $state with parameters from the URL so they're available when
   * 'resolving':
   * http://stackoverflow.com/questions/22985988/angular-ui-router-get-state-info-of-tostate-in-resolve
   */
  $provide.decorator("$state", ["$delegate", "$rootScope", function ($delegate: any, $rootScope: any): void {
    $rootScope.$on("$stateChangeStart", function (event: any, state: any, params: any): void {
      $delegate.toParams = params;
    });
    return $delegate;
  }]);
}

getConfig.$inject = ["$http", "jhConfig"];
function getConfig($http: any, jhConfig: any): void {
  var request: any = new XMLHttpRequest();
  request.open("GET", "config.json", false);
  request.send(null);
  if (request.status === 200) {
    var config: any = JSON.parse(request.responseText);
    angular.forEach(config, function(value: any, key: any): void {
       jhConfig[key] = value;
    });
  } else {
    console.warn("No configuration found");
  }
}

stateEvents.$inject = ["$rootScope", "$state", "RoomService"];
function stateEvents($rootScope: any, $state: any, RoomService: any): void {
  $rootScope.$on("$stateChangeStart", function (): void {
    /* Before changing state, cleanup feeds */
    RoomService.leave();
  });
  $rootScope.$on("$stateChangeError", function (): void {
    $state.go("signin");
  });
}

upgradeAdapter.bootstrap(document.documentElement, ["janusHangouts"], {
  strictDi: true
});