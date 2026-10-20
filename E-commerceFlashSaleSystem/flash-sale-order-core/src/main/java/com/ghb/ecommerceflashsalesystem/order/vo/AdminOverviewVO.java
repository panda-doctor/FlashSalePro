package com.ghb.ecommerceflashsalesystem.order.vo;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 管理端经营看板：订单/成交汇总 + 按天趋势 + 活动 Top5。
 * 全部聚合自 order 权威库，不跨服务调用。
 */
@Data
public class AdminOverviewVO {

    private Summary summary;
    private List<TrendPoint> trend;
    private List<TopActivity> topActivities;

    @Data
    public static class Summary {
        /** 已创建订单总数 */
        private long orderCount;
        /** 成交额（分） */
        private long gmv;
        /** 成交用户数（去重） */
        private long userCount;
        /** 今日已创建订单数 */
        private long todayOrderCount;
        /** 今日成交额（分） */
        private long todayGmv;
        /** 死信消息数（message_log.status=3） */
        private long deadLetterCount;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TrendPoint {
        /** yyyy-MM-dd */
        private String date;
        private long orderCount;
        private long gmv;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TopActivity {
        private Long activityId;
        private long orderCount;
        private long gmv;
    }
}
