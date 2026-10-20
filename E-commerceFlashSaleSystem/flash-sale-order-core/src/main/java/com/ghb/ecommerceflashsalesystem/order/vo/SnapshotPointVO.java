package com.ghb.ecommerceflashsalesystem.order.vo;

import com.ghb.ecommerceflashsalesystem.domain.entity.SeckillActivitySnapshot;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 活动快照趋势点（快照由 order 应用写入权威库 {@code flash_sale_order}）。
 */
@Data
public class SnapshotPointVO {

    private Long activityId;
    private Integer redisStock;
    private Long orderCount;
    private Long queuedMessageCount;
    private Long successCount;
    private Long duplicateRejectCount;
    private Long rateLimitRejectCount;
    private Long soldOutRejectCount;
    private LocalDateTime snapshotTime;

    public static SnapshotPointVO of(SeckillActivitySnapshot snapshot) {
        SnapshotPointVO vo = new SnapshotPointVO();
        vo.setActivityId(snapshot.getActivityId());
        vo.setRedisStock(snapshot.getRedisStock());
        vo.setOrderCount(snapshot.getOrderCount());
        vo.setQueuedMessageCount(snapshot.getQueuedMessageCount());
        vo.setSuccessCount(snapshot.getSuccessCount());
        vo.setDuplicateRejectCount(snapshot.getDuplicateRejectCount());
        vo.setRateLimitRejectCount(snapshot.getRateLimitRejectCount());
        vo.setSoldOutRejectCount(snapshot.getSoldOutRejectCount());
        vo.setSnapshotTime(snapshot.getSnapshotTime());
        return vo;
    }
}
