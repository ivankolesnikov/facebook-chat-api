"use strict";

var utils = require("../utils");

function formatAttachmentsGraphQLResponse(attachment) {
  switch (attachment.__typename) {
    case "MessageImage":
      return {
        type: "photo",
        ID: attachment.legacy_attachment_id,
        filename: attachment.filename,
        thumbnailUrl: attachment.thumbnail.uri,

        previewUrl: attachment.preview.uri,
        previewWidth: attachment.preview.width,
        previewHeight: attachment.preview.height,

        largePreviewUrl: attachment.large_preview.uri,
        largePreviewHeight: attachment.large_preview.height,
        largePreviewWidth: attachment.large_preview.width,

        // You have to query for the real image. See below.
        url: attachment.large_preview.uri, // @Legacy
        width: attachment.large_preview.width, // @Legacy
        height: attachment.large_preview.height, // @Legacy
        name: attachment.filename, // @Legacy

        // @Undocumented
        attributionApp: attachment.attribution_app
          ? {
              attributionAppID: attachment.attribution_app.id,
              name: attachment.attribution_app.name,
              logo: attachment.attribution_app.square_logo
            }
          : null

        // @TODO No idea what this is, should we expose it?
        //      Ben - July 15th 2017
        // renderAsSticker: attachment.render_as_sticker,

        // This is _not_ the real URI, this is still just a large preview.
        // To get the URL we'll need to support a POST query to
        //
        //    https://www.facebook.com/webgraphql/query/
        //
        // With the following query params:
        //
        //    query_id:728987990612546
        //    variables:{"id":"100009069356507","photoID":"10213724771692996"}
        //    dpr:1
        //
        // No special form though.
      };
    case "MessageAnimatedImage":
      return {
        type: "animated_image",
        ID: attachment.legacy_attachment_id,
        filename: attachment.filename,

        previewUrl: attachment.preview_image.uri,
        previewWidth: attachment.preview_image.width,
        previewHeight: attachment.preview_image.height,

        url: blob.animated_image.uri,
        width: blob.animated_image.width,
        height: blob.animated_image.height,

        thumbnailUrl: blob.preview_image.uri, // @Legacy
        name: attachment.filename, // @Legacy
        facebookUrl: attachment.animated_image.uri, // @Legacy
        rawGifImage: blob.animated_image.uri, // @Legacy
        animatedGifUrl: blob.animated_image.uri, // @Legacy
        animatedGifPreviewUrl: blob.preview_image.uri, // @Legacy
        animatedWebpUrl: blob.animated_image.uri, // @Legacy
        animatedWebpPreviewUrl: blob.preview_image.uri, // @Legacy

        // @Undocumented
        attributionApp: attachment.attribution_app
          ? {
              attributionAppID: attachment.attribution_app.id,
              name: attachment.attribution_app.name,
              logo: attachment.attribution_app.square_logo
            }
          : null
      };
    case "MessageVideo":
      return {
        type: "video",
        filename: attachment.filename,
        ID: attachment.legacy_attachment_id,

        thumbnailUrl: blob.large_image.uri, // @Legacy

        previewUrl: attachment.large_image.uri,
        previewWidth: attachment.large_image.width,
        previewHeight: attachment.large_image.height,

        url: attachment.playable_url,
        width: attachment.original_dimensions.x,
        height: attachment.original_dimensions.y,

        duration: attachment.playable_duration_in_ms,
        videoType: attachment.video_type.toLowerCase()
      };
      break;
    case "MessageFile":
      return {
        type: "file",
        filename: attachment.filename,
        ID: attachment.message_file_fbid,

        url: attachment.url,
        isMalicious: attachment.is_malicious,
        contentType: attachment.content_type,

        name: attachment.filename, // @Legacy
        mimeType: "", // @Legacy
        fileSize: -1 // @Legacy
      };
    case "MessageAudio":
      return {
        type: "audio",
        filename: attachment.filename,
        ID: attachment.url_shimhash, // Not fowardable

        audioType: attachment.audio_type,
        duration: attachment.playable_duration_in_ms,
        url: attachment.playable_url,

        isVoiceMail: attachment.is_voicemail
      };
    default:
      return {
        error: "Don't know about attachment type " + attachment.__typename
      };
  }
}

function formatExtensibleAttachment(attachment) {
  if (attachment.story_attachment) {
    return {
      type: "share",
      ID: attachment.legacy_attachment_id,
      url: attachment.story_attachment.url,

      title: attachment.story_attachment.title_with_entities.text,
      description:
        attachment.story_attachment.description &&
        attachment.story_attachment.description.text,
      source:
        attachment.story_attachment.source == null
          ? null
          : attachment.story_attachment.source.text,

      image:
        attachment.story_attachment.media == null
          ? null
          : attachment.story_attachment.media.animated_image == null &&
            attachment.story_attachment.media.image == null
            ? null
            : (
                attachment.story_attachment.media.animated_image ||
                attachment.story_attachment.media.image
              ).uri,
      width:
        attachment.story_attachment.media == null
          ? null
          : attachment.story_attachment.media.animated_image == null &&
            attachment.story_attachment.media.image == null
            ? null
            : (
                attachment.story_attachment.media.animated_image ||
                attachment.story_attachment.media.image
              ).width,
      height:
        attachment.story_attachment.media == null
          ? null
          : attachment.story_attachment.media.animated_image == null &&
            attachment.story_attachment.media.image == null
            ? null
            : (
                attachment.story_attachment.media.animated_image ||
                attachment.story_attachment.media.image
              ).height,
      playable:
        attachment.story_attachment.media == null
          ? null
          : attachment.story_attachment.media.is_playable,
      duration:
        attachment.story_attachment.media == null
          ? null
          : attachment.story_attachment.media.playable_duration_in_ms,
      playableUrl:
        attachment.story_attachment.media == null
          ? null
          : attachment.story_attachment.media.playable_url,

      subattachments: attachment.story_attachment.subattachments,

      // Format example:
      //
      //   [{
      //     key: "width",
      //     value: { text: "1280" }
      //   }]
      //
      // That we turn into:
      //
      //   {
      //     width: "1280"
      //   }
      //
      properties: attachment.story_attachment.properties.reduce(function(
        obj,
        cur
      ) {
        obj[cur.key] = cur.value.text;
        return obj;
      },
      {}),

      // Deprecated fields
      animatedImageSize: "", // @Legacy
      facebookUrl: "", // @Legacy
      styleList: "", // @Legacy
      target: "", // @Legacy
      thumbnailUrl:
        attachment.story_attachment.media == null
          ? null
          : attachment.story_attachment.media.animated_image == null &&
            attachment.story_attachment.media.image == null
            ? null
            : (
                attachment.story_attachment.media.animated_image ||
                attachment.story_attachment.media.image
              ).uri, // @Legacy
      thumbnailWidth:
        attachment.story_attachment.media == null
          ? null
          : attachment.story_attachment.media.animated_image == null &&
            attachment.story_attachment.media.image == null
            ? null
            : (
                attachment.story_attachment.media.animated_image ||
                attachment.story_attachment.media.image
              ).width, // @Legacy
      thumbnailHeight:
        attachment.story_attachment.media == null
          ? null
          : attachment.story_attachment.media.animated_image == null &&
            attachment.story_attachment.media.image == null
            ? null
            : (
                attachment.story_attachment.media.animated_image ||
                attachment.story_attachment.media.image
              ).height // @Legacy
    };
  } else {
    return { error: "Don't know what to do with extensible_attachment." };
  }
}

function formatReactionsGraphQL(reaction) {
  return {
    reaction: reaction.reaction,
    userID: reaction.user.id
  };
}

function formatEventData(event) {
  if (event == null) {
    return {};
  }

  switch (event.__typename) {
    case "ThemeColorExtensibleMessageAdminText":
      return {
        color: event.theme_color
      };
    case "ThreadNicknameExtensibleMessageAdminText":
      return {
        nickname: event.nickname,
        participantID: event.participant_id
      };
    case "ThreadIconExtensibleMessageAdminText":
      return {
        threadIcon: event.thread_icon
      };
    case "InstantGameUpdateExtensibleMessageAdminText":
      return {
        gameID: event.game.id,
        update_type: event.update_type,
        collapsed_text: event.collapsed_text,
        expanded_text: event.expanded_text,
        instant_game_update_data: event.instant_game_update_data
      };
    case "GameScoreExtensibleMessageAdminText":
      return {
        game_type: event.game_type
      };
    case "RtcCallLogExtensibleMessageAdminText":
      return {
        event: event.event,
        is_video_call: event.is_video_call,
        server_info_data: event.server_info_data
      };
    case "GroupPollExtensibleMessageAdminText":
      return {
        event_type: event.event_type,
        total_count: event.total_count,
        question: event.question
      };
    case "AcceptPendingThreadExtensibleMessageAdminText":
      return {
        accepter_id: event.accepter_id,
        requester_id: event.requester_id
      };
    case "ConfirmFriendRequestExtensibleMessageAdminText":
      return {
        friend_request_recipient: event.friend_request_recipient,
        friend_request_sender: event.friend_request_sender
      };
    case "AddContactExtensibleMessageAdminText":
      return {
        contact_added_id: event.contact_added_id,
        contact_adder_id: event.contact_adder_id
      };
    case "AdExtensibleMessageAdminText":
      return {
        ad_client_token: event.ad_client_token,
        ad_id: event.ad_id,
        ad_preferences_link: event.ad_preferences_link,
        ad_properties: event.ad_properties
      };
    // never data
    case "ParticipantJoinedGroupCallExtensibleMessageAdminText":
    case "ThreadEphemeralTtlModeExtensibleMessageAdminText":
    case "StartedSharingVideoExtensibleMessageAdminText":
    case "LightweightEventCreateExtensibleMessageAdminText":
    case "LightweightEventNotifyExtensibleMessageAdminText":
    case "LightweightEventNotifyBeforeEventExtensibleMessageAdminText":
    case "LightweightEventUpdateTitleExtensibleMessageAdminText":
    case "LightweightEventUpdateTimeExtensibleMessageAdminText":
    case "LightweightEventUpdateLocationExtensibleMessageAdminText":
    case "LightweightEventDeleteExtensibleMessageAdminText":
      return {};
    default:
      return {
        error: "Don't know what to with event data type " + event.__typename
      };
  }
}

function formatMessageGraphQLResponse(threadID, threadType, data) {
  switch (data.__typename) {
    case "UserMessage":
      // Give priority to stickers. They're seen as normal messages but we've
      // been considering them as attachments.
      var maybeStickerAttachment;
      if (data.sticker) {
        maybeStickerAttachment = [
          {
            type: "sticker",
            ID: data.sticker.id,
            url: data.sticker.url,

            packID: data.sticker.pack.id,
            spriteUrl: data.sticker.sprite_image,
            spriteUrl2x: data.sticker.sprite_image_2x,
            width: data.sticker.width,
            height: data.sticker.height,

            caption: data.snippet, // Not sure what the heck caption was.
            description: data.sticker.label, // Not sure about this one either.

            frameCount: data.sticker.frame_count,
            frameRate: data.sticker.frame_rate,
            framesPerRow: data.sticker.frames_per_row,
            framesPerCol: data.sticker.frames_per_col,

            stickerID: data.sticker.id, // @Legacy
            spriteURI: data.sticker.sprite_image, // @Legacy
            spriteURI2x: data.sticker.sprite_image_2x // @Legacy
          }
        ];
      }

      var mentionsObj = {};
      data.message.ranges.forEach(e => {
        mentionsObj[e.entity.id] = data.message.text.substr(e.offset, e.length);
      });

      return {
        type: "message",
        attachments: maybeStickerAttachment
            ? maybeStickerAttachment
            : data.blob_attachments && data.blob_attachments.length > 0
                ? data.blob_attachments.map(formatAttachmentsGraphQLResponse)
                : data.extensible_attachment
                    ? [formatExtensibleAttachment(data.extensible_attachment)]
                    : [],
        body: data.message.text,
        isGroup: threadType === "GROUP",
        messageID: data.message_id,
        senderID: data.message_sender.id,
        threadID: threadID,
        timestamp: data.timestamp_precise,

        mentions: mentionsObj,
        isUnread: data.unread,

        // New
        messageReactions: data.message_reactions
            ? data.message_reactions.map(formatReactionsGraphQL)
            : null,
        isSponsored: data.is_sponsored,
        snippet: data.snippet
      };
    case "ThreadNameMessage":
      return {
        type: "event",
        messageID: data.message_id,
        threadID: threadID,
        isGroup: threadType === "GROUP",
        senderID: data.message_sender.id,
        timestamp: data.timestamp_precise,
        eventType: "change_thread_name",
        snippet: data.snippet,
        eventData: {
          threadName: data.thread_name
        },

        // @Legacy
        author: data.message_sender.id,
        logMessageType: "log:thread-name",
        logMessageData: { name: data.thread_name }
      };
    case "ThreadImageMessage":
      return {
        type: "event",
        messageID: data.message_id,
        threadID: threadID,
        isGroup: threadType === "GROUP",
        senderID: data.message_sender.id,
        timestamp: data.timestamp_precise,
        eventType: "change_thread_image",
        snippet: data.snippet,
        eventData:
            data.image_with_metadata == null
                ? {} /* removed image */
                : {
                  /* image added */
                  threadImage: {
                    attachmentID: data.image_with_metadata.legacy_attachment_id,
                    width: data.image_with_metadata.original_dimensions.x,
                    height: data.image_with_metadata.original_dimensions.y,
                    url: data.image_with_metadata.preview.uri
                  }
                },

        // @Legacy
        logMessageType: "log:thread-icon",
        logMessageData: {
          thread_icon: data.image_with_metadata
              ? data.image_with_metadata.preview.uri
              : null
        }
      };
    case "ParticipantLeftMessage":
      return {
        type: "event",
        messageID: data.message_id,
        threadID: threadID,
        isGroup: threadType === "GROUP",
        senderID: data.message_sender.id,
        timestamp: data.timestamp_precise,
        eventType: "remove_participants",
        snippet: data.snippet,
        eventData: {
          // Array of IDs.
          participantsRemoved: data.participants_removed.map(function(p) {
            return p.id;
          })
        },

        // @Legacy
        logMessageType: "log:unsubscribe",
        logMessageData: {
          leftParticipantFbId: data.participants_removed.map(function(p) {
            return p.id;
          })
        }
      };
    case "ParticipantsAddedMessage":
      return {
        type: "event",
        messageID: data.message_id,
        threadID: threadID,
        isGroup: threadType === "GROUP",
        senderID: data.message_sender.id,
        timestamp: data.timestamp_precise,
        eventType: "add_participants",
        snippet: data.snippet,
        eventData: {
          // Array of IDs.
          participantsAdded: data.participants_added.map(function(p) {
            return p.id;
          })
        },

        // @Legacy
        logMessageType: "log:subscribe",
        logMessageData: {
          addedParticipants: data.participants_added.map(function(p) {
            return p.id;
          })
        }
      };
    case "VideoCallMessage":
      return {
        type: "event",
        messageID: data.message_id,
        threadID: threadID,
        isGroup: threadType === "GROUP",
        senderID: data.message_sender.id,
        timestamp: data.timestamp_precise,
        eventType: "video_call",
        snippet: data.snippet,

        // @Legacy
        logMessageType: "other"
      };
    case "VoiceCallMessage":
      return {
        type: "event",
        messageID: data.message_id,
        threadID: threadID,
        isGroup: threadType === "GROUP",
        senderID: data.message_sender.id,
        timestamp: data.timestamp_precise,
        eventType: "voice_call",
        snippet: data.snippet,

        // @Legacy
        logMessageType: "other"
      };
    case "GenericAdminTextMessage":
      return {
        type: "event",
        messageID: data.message_id,
        threadID: threadID,
        isGroup: threadType === "GROUP",
        senderID: data.message_sender.id,
        timestamp: data.timestamp_precise,
        snippet: data.snippet,
        eventType: data.extensible_message_admin_text_type.toLowerCase(),
        eventData: formatEventData(data.extensible_message_admin_text),

        // @Legacy
        logMessageType: utils.getAdminTextMessageType(
            data.extensible_message_admin_text_type
        ),
        logMessageData: data.extensible_message_admin_text // Maybe different?
      };
    default:
      return { error: "Don't know about message type " + data.__typename };
  }
}

function graphQLBatch(ctx, defaultFuncs, query) {
  // `queries` has to be a string. I couldn't tell from the dev console. This
  // took me a really long time to figure out. I deserve a cookie for this.
  var form = {
    queries: JSON.stringify({
      o0: query
    })
  };

  return defaultFuncs
    .post("https://www.facebook.com/api/graphqlbatch/", ctx.jar, form)
    .then(utils.parseAndCheckLogin(ctx, defaultFuncs))
    .then(function(resData) {
      if (resData.error) {
        throw resData;
      }
      // This returns us an array of things. The last one is the success /
      // failure one.
      // @TODO What do we do in this case?
      if (resData[resData.length - 1].error_results !== 0) {
        throw new Error("well darn there was an error_result");
      }
      return resData[0].o0.data;
    })
}

function loadMessage(ctx, defaultFuncs, threadID, messageId) {
  var query = {
    // This doc_id was valid on March 26th 2018.
    doc_id: "1801329719924418",
    query_params: {
      thread_and_message_id: {
        thread_id: threadID,
        message_id: messageId
      }
    }
  };

  return graphQLBatch(ctx, defaultFuncs, query)
    .then(function(resData) {
      // TODO@ Figure out how to get the correct thread type
      return formatMessageGraphQLResponse(threadID, undefined, resData.message);
    })
}

module.exports = {
  formatMessageGraphQLResponse,
  graphQLBatch,
  loadMessage
};