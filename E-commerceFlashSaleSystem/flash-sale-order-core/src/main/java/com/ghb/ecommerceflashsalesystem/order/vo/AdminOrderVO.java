package com.ghb.ecommerceflashsalesystem.order.vo;

import com.ghb.ecommerceflashsalesystem.domain.entity.SeckillOrder;
import com.ghb.ecommerceflashsalesystem.domain.enums.OrderStatusEnum;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 管理端订单视图：比用户端列表多用户、金额、失败原因与消息 ID，仅管理令牌可达。
 */
@Data
public class AdminOrderVO {

    private Long orderId;
    private String orderNo;
    private Long activityId;
    private Long productId;
    private Long userId;
    private Long seckillPrice;
    private String status;
    private String statusDesc;
    private String failureReason;
    private String streamMessageId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static AdminOrderVO of(SeckillOrder order) {
        AdminOrderVO vo = new AdminOrderVO();
        vo.setOrderId(order.getId());
        vo.setOrderNo(order.getOrderNo());
        vo.setActivityId(order.getActivityId());
        vo.setProductId(order.getProductId());
        vo.setUserId(order.getUserId());
        vo.setSeckillPrice(order.getSeckillPrice());
        OrderStatusEnum status = order.getStatus() == null ? null : OrderStatusEnum.fromValue(order.getStatus());
        if (status == null) {
            vo.setStatus(OrderStatusEnum.QUEUING.name());
            vo.setStatusDesc(OrderStatusEnum.QUEUING.getDescription());
        } else {
            vo.setStatus(status.name());
            vo.setStatusDesc(status.getDescription());
        }
        vo.setFailureReason(order.getFailureReason());
        vo.setStreamMessageId(order.getStreamMessageId());
        vo.setCreatedAt(order.getCreatedAt());
        vo.setUpdatedAt(order.getUpdatedAt());
        return vo;
    }
}
