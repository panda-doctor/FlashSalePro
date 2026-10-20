package com.ghb.ecommerceflashsalesystem.order.vo;

import com.ghb.ecommerceflashsalesystem.domain.entity.SeckillMessageLog;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 死信列表项：数据源是 {@code seckill_message_log}（status=3），
 * 重放仍由 {@code DeadLetterReplayService} 从死信流取完整消息体。
 */
@Data
public class DeadLetterItemVO {

    private String streamMessageId;
    private String orderNo;
    private Long activityId;
    private Long productId;
    private Long userId;
    private Integer retryCount;
    private String errorMessage;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static DeadLetterItemVO of(SeckillMessageLog log) {
        DeadLetterItemVO vo = new DeadLetterItemVO();
        vo.setStreamMessageId(log.getStreamMessageId());
        vo.setOrderNo(log.getOrderNo());
        vo.setActivityId(log.getActivityId());
        vo.setProductId(log.getProductId());
        vo.setUserId(log.getUserId());
        vo.setRetryCount(log.getRetryCount());
        vo.setErrorMessage(log.getErrorMessage());
        vo.setCreatedAt(log.getCreatedAt());
        vo.setUpdatedAt(log.getUpdatedAt());
        return vo;
    }
}
