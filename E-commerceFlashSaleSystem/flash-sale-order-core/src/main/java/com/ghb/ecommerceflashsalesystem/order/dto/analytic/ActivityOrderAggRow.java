package com.ghb.ecommerceflashsalesystem.order.dto.analytic;

import lombok.Data;

/**
 * 活动维度订单聚合投影。
 */
@Data
public class ActivityOrderAggRow {
    private Long activityId;
    private long orderCount;
    private long gmv;
}
